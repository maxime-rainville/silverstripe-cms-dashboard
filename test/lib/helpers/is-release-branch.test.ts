import {expect} from 'chai'
import {isReleaseBranch} from '../../../src/lib/helpers/is-relase-branch'

describe('isReleaseBranch', () => {
  it('next major', () => {
    expect(isReleaseBranch('master')).to.be.true
    expect(isReleaseBranch('main')).to.be.true
  })

  it('next minor', () => {
    expect(isReleaseBranch('1')).to.be.true
    expect(isReleaseBranch('20')).to.be.true
  })

  it('patch', () => {
    expect(isReleaseBranch('1.0')).to.be.true
    expect(isReleaseBranch('2.9')).to.be.true
    expect(isReleaseBranch('2.99')).to.be.true
  })

  it('tag', () => {
    expect(isReleaseBranch('1.0.0')).to.be.false
  })

  it('pulls', () => {
    expect(isReleaseBranch('pulls/1/test')).to.be.false
  })

  it('beta', () => {
    expect(isReleaseBranch('1.0.0-beta1')).to.be.false
  })
})
