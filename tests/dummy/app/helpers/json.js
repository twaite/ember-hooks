import { helper } from '@ember/component/helper';

export function json(params/*, hash*/) {
  return JSON.stringify(params);
}

export default helper(json);
