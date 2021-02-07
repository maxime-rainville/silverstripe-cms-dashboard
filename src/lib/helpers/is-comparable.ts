/**
 * Check if HEAD can be merge into BASE. This method assumes that the branches are provided in a sequential order.
 * @param head
 * @param base
 */
export function isComparable(head: string, base: string) {
  // Master/main will always be the last branch because they have the higest priority.
  // Since we assume master to be reserved for the next minor, it should always be comparable
  if (['master', 'main'].indexOf(base) !== -1) {
    return true
  }

  // If HEAD and BASE are on the same major release cycle, they are comparable.
  // e.g. 3.7 can not be compared to 4.0. 4.0 can be compared to 4.1 or 4.
  const headMatches = head.match(/^(\d+)/)
  const baseMatches = base.match(/^(\d+)/)
  return headMatches && baseMatches && headMatches[1] === baseMatches[1]
}
