import {Octokit} from '@octokit/rest'
import chai from 'chai'
import spies from 'chai-spies'
import chaiAsPromised from 'chai-as-promised'
import {GithubClient} from '../../src/lib/github-client'

chai.use(spies)
chai.use(chaiAsPromised)
chai.should()

describe('GithubClient', () => {
  it('master/main', done => {
    const octokit = new Octokit()
    let callCount = 0
    chai.spy.on(octokit.repos, 'listTags', function () {
      if (callCount === 0) {
        callCount++
        return Promise.resolve({data: [
          {name: '1.2.3'},
          {name: '1.2.3-beta1'},
          {name: '123.0.0'},
        ]})
      }
      return Promise.resolve({data: []})
    })

    const client = new GithubClient(octokit)
    client.getTags('silverstripe', 'silverstripe-framework')
    .should.eventually.eql(['1.2.3', '123.0.0']).notify(done)

    // expect(octokit.repos.listTags).to.have.been.called.with({
    //   owner: 'silverstripe', repo: 'silverstripe-framework',
    // })
  })
})
