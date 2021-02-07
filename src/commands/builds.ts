import {Command, flags} from '@oclif/command'
import * as Config from '@oclif/config'
import {OrgFilter} from '../lib/Filters/org-filter'
import {SilverstripeOrgFilter} from '../lib/Filters/silverstripe-org-filter'
import {SupportedOrgFilter} from '../lib/Filters/supported-org-filter'
import {noop} from '../lib/helpers/noop'
import {TravisClient} from '../lib/travis-client'
import {Branch} from '../lib/TravisTypes/branch'
import {Repository} from '../lib/TravisTypes/repository'

export default class Builds extends Command {
  private client: TravisClient|undefined;

  static description = 'Fetch build status for silverstripe module'

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({char: 'v'}),
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
    token: flags.string({char: 't', description: 'Travis token'}),
    domain: flags.string({char: 'd', description: 'Travis domain to target: org or com', default: 'com'}),
    output: flags.enum({char: 'o', options: ['pretty', 'json'], default: 'pretty', description: 'Control the output format'}),
    failed: flags.boolean({char: 'f', default: false, description: 'Only display failed build.'}),
    verbose: flags.boolean({default: false, description: 'Print out debug statement.'}),
  }

  static args = [{name: 'command'}]

  constructor(argv: string[], config: Config.IConfig) {
    super(argv, config)
    this.buildURL = this.buildURL.bind(this)
    this.print = this.print.bind(this)
    this.getBuildsForOrgs = this.getBuildsForOrgs.bind(this)
    this.getBuildsForOrg = this.getBuildsForOrg.bind(this)
    this.printBranches = this.printBranches.bind(this)
    this.toJson = this.toJson.bind(this)
  }

  private getOrgs(): OrgFilter[] {
    const filters: OrgFilter[] = [
      // 'dnadesign',
      // 'bringyourownideas',
      // 'colymba',
      // 'hafriedlander',
      // 'lekoala',
      // 'silverstripe-themes',
      // 'symbiote',
      // 'tijsverkoyen',
      // 'tractorcow-farm',
      // 'tractorcow',
      // 'undefinedoffset',
    ].map(org => new SupportedOrgFilter(org))

    return filters.concat([SilverstripeOrgFilter])
  }

  async run() {
    const {flags: {token, domain, output, failed, verbose}} = this.parse(Builds)

    const travisToken = token ?? process.env.TRAVIS_TOKEN

    if (!travisToken) {
      this.error('You must provide a travis token with `--token` or with TRAVIS_TOKEN environement variable.')
    }

    const lcDomain = domain.toLocaleLowerCase()

    if (lcDomain !== 'org' && lcDomain !== 'com') {
      this.error('`domain` must be either `com` or `org`.')
    }

    this.client = new TravisClient(travisToken, lcDomain, verbose ? this.log : noop)

    const outputMethod =
        output === 'pretty' ? this.printBranches :
          output === 'json' ? this.toJson :
            noop

    this.getBuildsForOrgs(this.getOrgs())
    .then(failed ? this.filterFailed : b => b)
    .then(outputMethod)
  }

  /**
   * Filter out failed branches
   * @param branches
   */
  filterFailed(branches: Branch[]): Branch[] {
    return branches.filter(branch => (
      branch.last_build &&
      ['failed', 'errored'].indexOf(branch.last_build?.state) !== -1
    ))
  }

  toJson(branches: Branch[]) {
    const results: any = {}

    branches.forEach(({last_build, repository: {slug}, name}) => {
      if (!last_build) {
        return
      }

      if (!results[slug]) {
        results[slug] = {}
      }

      const {state, started_at, id} = last_build

      results[slug][name] = {state, started_at, id}
    })

    this.log(JSON.stringify(results))
  }

  printBranches(branches: Branch[]) {
    branches.forEach(this.print)
  }

  print(branch: Branch) {
    let stateColour
    switch (branch.last_build?.state) {
    case 'failed':
      stateColour = '\u001B[41m'
      break
    case 'passed':
      stateColour = '\u001B[42m'
      break
    case 'running':
      stateColour = '\u001B[43m'
      break
    case 'errored':
      stateColour = '\u001B[45m'
      break
    default:
      stateColour = '\u001B[46m'
    }

    const url = branch.last_build ? this.buildURL(branch.repository.slug, branch.last_build.id) : ''

    this.log(`\u001B[36m${branch.repository.slug}\u001B[0m:\u001B[35m${branch.name}\u001B[0m \t${stateColour} ${branch.last_build?.state} \u001B[0m \t${url}`)
  }

  private getBuildsForOrgs(orgs: OrgFilter[]): Promise<Branch[]> {
    return Promise.all(
      orgs.map(this.getBuildsForOrg)
    ).then((branches: any[]) => [].concat(...branches))
  }

  private getBuildsForOrg(org: OrgFilter): Promise<Branch[]> {
    if (!this.client) {
      this.error('Client has not been initialsed')
    }

    const client = this.client

    return client.getRepos(org.name())
    .then((repos: Repository[]) => repos ? repos.filter(org.includeRepo) : [])
    .then((repos: Repository[]) => Promise.all(repos.map(({slug}) => client.getBranches(slug))))
    .then((branches: any[]) => [].concat(...branches))
    .then((branches: Branch[]) => branches.filter(org.includeBranch))
  }

  private buildURL(slug: string, id: number): string {
    return `https://travis-ci.org/github/${slug}/builds/${id}`
  }
}
