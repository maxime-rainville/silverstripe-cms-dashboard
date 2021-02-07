import {Commit} from './commit'

/**
 * Result of comparaison between two branches
 */
export interface Compare {
  base: string;
  head: string;
  html_url: string;
  ahead_by: number;
  commits: Commit[];
}
