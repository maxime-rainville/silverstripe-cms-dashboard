import {Command, flags} from '@oclif/command'
import * as Config from '@oclif/config'
import {Octokit, RestEndpointMethodTypes} from '@octokit/rest'
import {data as ssData} from 'silverstripe-cms-meta'
import {Throttle} from '../lib/throttle'
import {isReleaseBranch} from '../lib/helpers/is-relase-branch'
import {sortBranch} from '../lib/helpers/sort-branch'
import {isComparable} from '../lib/helpers/is-comparable'
import {CompareEntry} from '../types/compare-entry'
import {removeNulls} from '../lib/helpers/remove-nulls'

export default class Unrelease extends Command {
  private octokit = new Octokit({ });

  private throttle = new Throttle(5);

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
      return this.getBranches(org, repo)
      .then(branches => this.findMergeUps(org, repo, branches))
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
   * Get a list of branches matching our release approach sorting from the lowest version te the highest version.
   * @param owner
   * @param repo
   */
  public getBranches(owner: string, repo: string) {
    return this.throttle.throttle(() => this.octokit.repos.listBranches({owner, repo}))
    .then(({data}: RestEndpointMethodTypes['repos']['listBranches']['response']) => (
      data.map(({name}) => name)
      .filter(isReleaseBranch)
      .sort(sortBranch)
    ))
  }

  public getTags(owner: string, repo: string) {
    return this.throttle.throttle(() => this.octokit.repos.listTags({owner, repo}))
    .then(({data}: RestEndpointMethodTypes['repos']['listTags']['response']) => (
      data.map(({name}) => name)
    ))
  }

  /**
   * Given a list of branches, find all the ones needing to2 be merge up.
   * @param owner
   * @param repo
   * @param branches Branches need to be sorted
   */
  public findMergeUps(owner: string, repo: string, branches: string[]) {
    // Initialise the first comparasion
    let head = branches.shift()
    if (!head) {
      return []
    }
    let base: string|undefined
    const comparePromises = []

    // Keep looping until we don't have any branch left
    base = branches.shift()
    while (base) {
      // Check if `head` is meant to be merge into `base`
      if (isComparable(head, base)) {
        // If it is ask GitHub to compare them, to see if there's anf outstanding commits
        comparePromises.push(this.compare(owner, repo, head, base))
      }

      // The base becomes the HEAD for the next pass
      head = base
      base = branches.shift()
    }

    return Promise.all(comparePromises)
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
