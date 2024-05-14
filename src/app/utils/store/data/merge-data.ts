import {clone} from './clone-value';
import {Arr, Data} from './data';
import {mergeArr} from './merge-arr';
import {removeUndefined} from './remove-undefined';

export const mergeData = (a: Data, b: Data, cloneData = true): Data => {

  const data: Data = {};

  if (cloneData) {
    a = clone(a);
    b = clone(b);
  }

  for (const key of Object.getOwnPropertyNames(b)) {

    const itemA = a[key];
    const itemB = b[key];

    if (Array.isArray(itemA) && Array.isArray(itemB)) {
      data[key] = mergeArr(itemA as Arr, itemB as Arr, false);
    } else if (typeof itemA === 'object' && itemA !== null && typeof itemB === 'object' && itemB !== null) {
      data[key] = mergeData(itemA as Data, itemB as Data, false);
    } else if (itemB !== undefined) {

      if (itemB !== null && (Array.isArray(itemB) || typeof itemB === 'object')) {
        data[key] = removeUndefined(itemB);
      } else {
        data[key] = itemB;
      }
    }
  }

  return data;
};
