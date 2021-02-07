/**
 * Type guard to remove null/undefined value
 * @param value
 */
export function removeNulls<S>(value: S | undefined | null): value is S {
  return value !== null && value !== undefined
}
