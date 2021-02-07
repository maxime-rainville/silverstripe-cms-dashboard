import {Compare} from './compare'

/**
 * An entry for a module with all it's comparaison branch.
 */
export interface CompareEntry {
  repo: string;
  compares: Compare[];
}
