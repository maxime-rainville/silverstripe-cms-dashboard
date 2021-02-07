import {Octokit} from '@octokit/rest'
import chai, {expect} from 'chai'
import spies from 'chai-spies'
import {GithubClient} from '../../src/lib/github-client'

chai.use(spies)

describe('GithubClient', () => {
  it('master/main', () => {
    const octokit = new Octokit()
    chai.spy.on(octokit.repos, 'listTags', function () {
      return Promise.resolve({data: [
        {name: '1.2.3'},
        {name: '1.2.3-beta1'},
      ]})
    })

    const client = new GithubClient(octokit)
    client.getTags('silverstripe', 'silverstripe-framework').then(console.dir)
    expect(octokit.repos.listTags).to.have.been.called.with({
      owner: 'silverstripe', repo: 'silverstripe-framework',
    })
  })
})
