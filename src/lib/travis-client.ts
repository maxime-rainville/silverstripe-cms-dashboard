import {Throttle} from './throttle'
import {Branch} from './TravisTypes/branch'
import {Repository} from './TravisTypes/repository'
import {RestClient, IRequestOptions} from 'typed-rest-client'
import {noop} from './helpers/noop'

type logFn = (message: string) => any

class TravisClient {
    private client: RestClient;

    private throttler = new Throttle(20);

    constructor(private token: string, domain: 'com'|'org' = 'com', private log: logFn = noop) {
      this.client = new RestClient('fetch-traviss-data', `https://api.travis-ci.${domain}`)
      this.get = this.get.bind(this)
      this.getAll = this.getAll.bind(this)
      this.getBranches = this.getBranches.bind(this)
      this.getLastBuildForBranch = this.getLastBuildForBranch.bind(this)
    }

    private args() {
      return {
        'Content-Type': 'application/json',
        'Travis-API-Version': 3,
        'User-Agent': 'API Explorer',
        Authorization: `token ${this.token}`,
      }
    }

    public get(endpoint: string, params: any = {}): Promise<any> {
      return this.throttler.throttle(() => {
        return new Promise(resolve => {
          const options: IRequestOptions = {
            queryParameters: {params},
            additionalHeaders: this.args(),
          }
          this.log(`/${endpoint} ${JSON.stringify(params)}`)

          this.client.get(`/${endpoint}`, options).then(response => {
            this.log(`Status code: ${response.statusCode}`)
            resolve(response.result)
          })
        })
      })
    }

    public getAll(endpoint: string, key: string, parameters: any = {}): Promise<any> {
      return this.get(endpoint, parameters).then(data => {
        if (!data || !data['@pagination']) {
          return {}
        }

        const {is_last, next}  = data['@pagination']
        if (is_last) {
          return data
        }
        const pageData = data[key]
        const {limit, offset} = next
        return this.getAll(endpoint, key, {...parameters, limit, offset})
        .then(followupData => ({
          ...data,
          [key]: [...pageData, ...followupData[key]],
        }))
      })
    }

    public getFirst(endpoint: string, key: string, parameters: any = {}): Promise<any> {
      return this.get(endpoint, parameters).then(data => {
        if (!data[key] || !data[key][0]) {
          return {}
        }

        return data[key][0]
      })
    }

    public getRepos(org: string): Promise<Repository[]> {
      return this.getAll(
        `owner/github/${org}/repos`,
        'repositories',
        {private: false, active: true}
      )
      .then(data => data.repositories)
      .catch((error: any) => {
        // eslint-disable-next-line no-console
        console.error(error)
        return []
      })
    }

    public getBranches(repo: string) {
      return this.getAll(`repo/${encodeURIComponent(repo)}/branches`, 'branches', {exists_on_github: true})
      .then(data => data.branches)
      .then((branches: Branch[]) => {
        return Promise.all(
          branches.map(
            branch =>
              this.getLastBuildForBranch(repo, branch.name).then(last_build => ({...branch, last_build}))
          )
        )
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error(error)
        return false
      })
    }

    public getLastBuildForBranch(repo: string, branch: string): Promise<any> {
      return this.getFirst(
        `repo/${encodeURIComponent(repo)}/builds`,
        'builds',
        {'branch.name': branch, event_type: 'push,api,cron', sort_by: 'number:desc', limit: 1}
      ).then(data => {
        return data
      })
      .catch((error: any) => {
        // eslint-disable-next-line no-console
        console.error(error)
        return []
      })
    }
}

export {TravisClient}
