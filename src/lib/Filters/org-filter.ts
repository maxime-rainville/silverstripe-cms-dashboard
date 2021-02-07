import {Branch} from '../TravisTypes/branch'
import {Repository} from '../TravisTypes/repository'

/**
 * Provides the information necessary to know which repo and branch on an org should be included
 */
export interface OrgFilter {
  name(): string;
  includeRepo(repo: Repository): boolean;
  includeBranch(branch: Branch): boolean;
}
