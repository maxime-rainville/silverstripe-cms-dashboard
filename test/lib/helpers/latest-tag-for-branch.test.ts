import {expect} from 'chai'
import {latestTagForBranch} from '../../../src/lib/helpers/latest-tag-for-branch'

const testTags = [
  '0.0.1',
  '4.0.0',
  '4.0.1',
  '4.1.0',
  '4.3.0',
]

describe('latestTagForBranch', () => {
  it('Branch on same release line', () => {
    expect(latestTagForBranch('4.0', testTags)).to.equal('4.0.1')
    expect(latestTagForBranch('4.2', testTags)).to.equal('4.1.0')
    expect(latestTagForBranch('4.3', testTags)).to.equal('4.3.0')
  })
  it('Next minor', () => {
    expect(latestTagForBranch('4', testTags)).to.equal('4.3.0')
    expect(latestTagForBranch('0', testTags)).to.equal('0.0.1')
  })
  it('Next major', () => {
    expect(latestTagForBranch('5', testTags)).to.equal('4.3.0')
    expect(latestTagForBranch('master', testTags)).to.equal('4.3.0')
    expect(latestTagForBranch('main', testTags)).to.equal('4.3.0')
    expect(latestTagForBranch('2', testTags)).to.equal('0.0.1')
  })
})
