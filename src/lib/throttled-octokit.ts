import {Octokit} from '@octokit/rest'
import {throttling} from '@octokit/plugin-throttling'

// @ts-ignore
class MyOctoKit extends Octokit.plugin(throttling) {
  constructor(options: {[x: string]: any} = {}) {
    super({
      ...options,
      throttle: {
        onRateLimit: () => {
          // Retry twice after hitting a rate limit error, then give up
          if (options.request.retryCount <= 10) {
            return true
          }
          throw new Error('We have hit the rate limit and retried 10 times.')
        },
        onAbuseLimit: () => {
          throw new Error('Oh no ... We are abusing GitHub! Shame on us!')
        },
      },
    })
  }
}

const ThrottledOctoKit: Octokit = MyOctoKit as any

export {
  ThrottledOctoKit,
}
