import {Command, flags} from '@oclif/command'
import * as Config from '@oclif/config'
import {Octokit} from '@octokit/rest'
import {data as ssData} from 'silverstripe-cms-meta'
import {Throttle} from '../lib/throttle'
import {CompareEntry} from '../types/compare-entry'
import {removeNulls} from '../lib/helpers/remove-nulls'
import {GithubClient} from '../lib/github-client'
import {latestTagForBranch} from '../lib/helpers/latest-tag-for-branch'

export default class Unrelease extends Command {
  private octokit = new Octokit({ });

  private throttle = new Throttle(5);

  private github: GithubClient = new GithubClient();

  static description = 'Display Silverstripe module that have outstanding commits to release'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    token: flags.string({char: 't', description: 'GitHub Token'}),
    needMergeOnly: flags.boolean({description: 'Only show module and branches with outstanding commit to merge up.', default: false}),
    commits: flags.boolean({char: 'c', description: 'Show commits', default: false}),
    filter: flags.string({char: 'f', description: 'Filter by module name'}),
    output: flags.enum({char: 'o', options: ['pretty', 'json'], default: 'pretty', description: 'Control the output format'}),
    supportedOnly: flags.boolean({default: false, description: 'Limit results to supported module'}),
    throttle: flags.integer({default: 5, description: 'Number of concurent API requests that can be run.'}),
  }

  static args = [{name: 'file'}]

  constructor(argv: string[], config: Config.IConfig) {
    super(argv, config)
    this.prettyOutput = this.prettyOutput.bind(this)
    this.jsonOutput = this.jsonOutput.bind(this)
  }

  async run() {
    const {flags} = this.parse(Unrelease)

    const {token, commits: showCommits, needMergeOnly, filter, output, supportedOnly, throttle} = flags

    // Init the GitHub Rest client
    if (token || process.env.GITHUB_TOKEN) {
      this.octokit = new Octokit({
        auth: token ?? process.env.GITHUB_TOKEN,
      })
    }

    this.throttle = new Throttle(throttle)

    this.github = new GithubClient(this.octokit, this.throttle)

    // Fetch merges UP from GitHub
    const dataFetches = this.getRepos(supportedOnly)
    // Filter module by name
    .filter(filter ? (module => module.repo.indexOf(filter) > -1) : () => true)
    .map(entry => {
      // Split the module name in org and repo
      const matches = entry.repo.match(/^(.+)\/(.+)$/)
      if (matches === null) {
        return null
      }
      const org = matches[1]
      const repo = matches[2]

      // Fetch branch data for this repo
      return Promise.all([this.github.getBranches(org, repo), this.github.getTags(org, repo)])
      .then(resolvedPRomises => {
        const [branches, tags] = resolvedPRomises
        return this.findMergeUps(org, repo, branches, tags)
      })
      .then(compares => compares.filter(removeNulls))
      .then(compares => ({repo: entry.repo, compares}))
      .catch(() => {
        this.error(`# Failed for ${entry.repo}`)
      })
    })

    // Pick an output function
    const outCallback = output === 'json' ? this.jsonOutput : this.prettyOutput

    // Print out the result
    Promise.all(dataFetches).then(data => outCallback(data.filter(removeNulls), needMergeOnly, showCommits))
  }

  /**
   * Retrieve a list of module to query.
   * @param supportedOnly
   */
  public getRepos(supportedOnly: boolean) {
    return supportedOnly ? ssData.filter(repo => Boolean(repo.supported)) : ssData
  }

  /**
   * Get the default branch for this repo.
   * @param owner
   * @param repo
   */
  public defaultBranch(owner: string, repo: string) {
    return this.throttle.throttle(() => this.octokit.repos.get({owner, repo}))
    .then(({data}) => {
      return data.default_branch
    })
  }

  /**
   * Given a list of branches, find all the ones needing to2 be merge up.
   * @param owner
   * @param repo
   * @param branches Branches need to be sorted
   * @param tags
   */
  public findMergeUps(owner: string, repo: string, branches: string[], tags: string[]) {
    const comparePromises = branches.map(branch => {
      const tag = latestTagForBranch(branch, tags)

      return tag ? this.compare(owner, repo, branch, tag) : undefined
    })

    return Promise.all(comparePromises.filter(removeNulls))
  }

  /**
   * Ask GitHub if they are commit in HEAD that are not in BASE
   * @param owner
   * @param repo
   * @param head
   * @param base
   */
  public compare(owner: string, repo: string, head: string, base: string) {
    return this.throttle.throttle(() => this.octokit.repos.compareCommits({owner, repo, base, head}))
    .then(({data: {ahead_by, commits, html_url}}) => ({
      base, head, ahead_by, commits, html_url,
    }))
    .catch(error => {
      this.error(error)
      return null
    })
  }

  /**
   * Print the result set to the console in a pretty format smelly humans can understand
   * @param data
   * @param needMergeOnly
   * @param showCommits
   */
  public prettyOutput(data: CompareEntry[], needMergeOnly: boolean, showCommits: boolean) {
    data.forEach(({repo, compares}) => {
      if (needMergeOnly && !compares.find(compare => compare.ahead_by > 0)) {
        // Skip this module because we're not showing entries that don't have anything to merge
        return
      }

      this.log(`# ${repo}`)
      compares.forEach(compare => {
        if (needMergeOnly && compare.ahead_by === 0) {
          // Skip this branch because there's nothing to merge
          return
        }
        // Show branch comparaison
        this.log(`* ${compare.base}...${compare.head}: \ta head by ${compare.ahead_by}\t ${compare.html_url}`)

        // Show commit
        showCommits && compare.commits.forEach(commit => {
          this.log(`  * ${commit.commit.author?.name} - ${commit.commit.message.split('\n')[0]}`)
        })
      })

      this.log()
    })
  }

  /**
   * Print out the comparaison data to JSON
   * @param data
   * @param needMergeOnly
   * @param showCommits
   */
  public jsonOutput(data: CompareEntry[], needMergeOnly: boolean, showCommits: boolean) {
    const json = data
    .filter(({compares}) => !needMergeOnly || compares.find(compare => compare.ahead_by > 0))
    .map(({compares, ...rest}) => {
      return {
        ...rest,
        compares: compares
        .filter(compare => (!needMergeOnly || compare.ahead_by > 0))
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        .map(({commits, html_url, ...compare}) => ({
          ...compare,
          commits: showCommits ? (commits ? commits : []).map(({sha}) => sha) : undefined,
        })),
      }
    })

    this.log(JSON.stringify(json, null, 2))
  }
}
