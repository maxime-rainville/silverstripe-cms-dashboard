import {Octokit, RestEndpointMethodTypes} from '@octokit/rest'
import {Throttle} from '../lib/throttle'
import {isReleaseBranch} from './helpers/is-relase-branch'
import {sortBranch} from './helpers/sort-branch'

export class GithubClient {
  private octokit: Octokit

  private throttle: Throttle

  constructor(
    octokit = new Octokit({ }),
    throttle = new Throttle(5)
  ) {
    this.octokit = octokit
    this.throttle = throttle
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
}
