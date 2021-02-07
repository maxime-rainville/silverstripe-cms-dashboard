
/**
 * Determine if the provided branch name is used to release code.
 * @param name
 */
export function isReleaseBranch(name: string): boolean {
  return name === 'master' ||
    name === 'main' ||
    Boolean(name.match(/^\d+(\.\d+)?$/))
}
