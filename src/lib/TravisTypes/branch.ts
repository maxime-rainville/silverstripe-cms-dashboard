import {Build} from './build'
import {Repository} from './repository'

export interface Branch {
  name: string;
  last_build?: Build;
  repository: Repository;
}
