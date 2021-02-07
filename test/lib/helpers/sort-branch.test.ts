import {expect} from 'chai'
import {sortBranch} from '../../../src/lib/helpers/sort-branch'

describe('sortBranch', () => {
  it('equal', () => {
    expect(sortBranch('master', 'master')).to.equal(0)
    expect(sortBranch('1.2.3', '1.2.3')).to.be.equal(0)
  })

  it('master/main trunk everything', () => {
    expect(sortBranch('master', '999.99')).to.equal(1)
    expect(sortBranch('main', '999.99.99')).to.equal(1)
    expect(sortBranch('123', 'master')).to.equal(-1)
    expect(sortBranch('123.123', 'main')).to.equal(-1)
  })

  it('major', () => {
    expect(sortBranch('4', '3')).to.equal(1)
    expect(sortBranch('4', '3.3')).to.equal(1)
    expect(sortBranch('4.0', '3')).to.equal(1)
    expect(sortBranch('4.0', '3.9')).to.equal(1)

    expect(sortBranch('4', '5')).to.equal(-1)
    expect(sortBranch('4', '5.3')).to.equal(-1)
    expect(sortBranch('4.0', '7')).to.equal(-1)
    expect(sortBranch('4.0', '10.909')).to.equal(-1)
  })

  it('minor', () => {
    expect(sortBranch('4', '4.0')).to.equal(1)
    expect(sortBranch('4', '4.99999')).to.equal(1)
    expect(sortBranch('4.3', '4.2')).to.equal(1)
    expect(sortBranch('4.10', '4.9')).to.equal(1)

    expect(sortBranch('4.0', '4')).to.equal(-1)
    expect(sortBranch('4.99999', '4')).to.equal(-1)
    expect(sortBranch('4.2', '4.3')).to.equal(-1)
    expect(sortBranch('4.9', '4.10')).to.equal(-1)
  })
})
