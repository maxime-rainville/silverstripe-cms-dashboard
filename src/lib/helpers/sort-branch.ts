/**
 * Combare two branch names
 * @param a
 * @param b
 */
export function sortBranch(a: string, b: string) {
  // Two branches are equal
  if (a === b) {
    return 0
  }

  // Main/Master are implicitely the top branch
  if (a === 'master' || a === 'main') {
    return 1
  }

  if (b === 'master' || b === 'main') {
    return -1
  }

  // Break down the branch into their sub components
  const aMatch = a.match(/^(\d+)(\.\d+)?$/)
  const bMatch = b.match(/^(\d+)(\.\d+)?$/)

  if (!aMatch || !bMatch) {
    throw new Error('Invalid branch name should have been filtered')
  }

  // Compare the major version
  const aMajor = Number.parseInt(aMatch[1], 10)
  const bMajor = Number.parseInt(bMatch[1], 10)
  if (aMajor > bMajor) {
    return 1
  }
  if (aMajor < bMajor) {
    return -1
  }

  // If the branch doesn't have minor part, assume a gigantic value. eg: `4` is always going to be bigger than 4.12345
  const aMinor = aMatch[2] ? Number.parseInt(aMatch[2].replace('.', ''), 10) : 9999999
  const bMinor = bMatch[2] ? Number.parseInt(bMatch[2].replace('.', ''), 10) : 9999999
  if (aMinor > bMinor) {
    return 1
  }
  if (aMinor < bMinor) {
    return -1
  }

  return 0
}
