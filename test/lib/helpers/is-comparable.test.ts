import {expect} from 'chai'
import {isComparable} from '../../../src/lib/helpers/is-comparable'

describe('isComparable', () => {
  it('master/main', () => {
    expect(isComparable('4.5', 'master')).to.be.true
    expect(isComparable('5', 'main')).to.be.true
  })

  it('patch into minor', () => {
    expect(isComparable('4.5', '4')).to.be.true
  })

  it('patch into patch', () => {
    expect(isComparable('4.5', '4.6')).to.be.true
    expect(isComparable('4.5', '4.7')).to.be.true
  })

  it('accross majors', () => {
    expect(isComparable('4.5', '5.6')).to.be.false
    expect(isComparable('4.5', '5')).to.be.false
    expect(isComparable('4', '5')).to.be.false
  })
})
