import {noTags} from './no-tags'
import {OrgFilter} from './org-filter'

const excludedRepos: string[] = []

export const SilverstripeOrgFilter: OrgFilter = {
  name: () => 'silverstripe',
  includeRepo: ({name}) => excludedRepos.indexOf(name) === -1,
  includeBranch: ({name}) => noTags(name),
}
