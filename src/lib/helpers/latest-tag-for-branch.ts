
const nines = 99999999

const zero = '0.0.0'

type VersionArray = [number, number, number]

/**
 * Compare a tag version array to another tag compare array
 * @param as
 * @param bs
 */
function tagSort(as: VersionArray, bs: VersionArray): number {
  let i = 0
  let a = as[i]
  let b = bs[i]

  while (a !== undefined && b !== undefined) {
    if (a === b) {
      i++
      // segment of the version number are equal. Let's look at the next segment
      a = as[i]
      b = bs[i]
      continue
    }
    return a - b
  }

  return 0
}

/**
 * Find the tag that a specific branch should be compared to.
 * @param branch
 * @param tags
 */
export function latestTagForBranch(branch: string, tags: string[]): string|undefined {
  let matches: VersionArray

  if (['master', 'main'].includes(branch)) {
    matches = [nines, nines, nines]
  } else if (branch.match(/^\d+$/)) {
    matches = [parseInt(branch, 10), nines, nines]
  } else {
    matches = branch.split('.').map(v => parseInt(v, 10)).concat(nines) as VersionArray
  }

  const topTag = tags
  .map(tag => tag.split('.').map(v => {
    return parseInt(v, 10)
  }) as VersionArray)
  .reduce((topTag, prospectiveTag) => {
    if (tagSort(matches, prospectiveTag) > 0 && tagSort(prospectiveTag, topTag) > 0) {
      // If the prospective tag is smaller than the branch tag, but bigger than the current topTag
      return prospectiveTag
    }
    return topTag
  }, [0, 0, 0])

  const topTagStr = topTag.join('.')

  if (topTagStr === zero && !tags.includes(zero)) {
    return undefined
  }

  return topTagStr
}
