import {clone} from './clone-value';
import {Arr, Data} from './data';
import {mergeData} from './merge-data';
import {removeUndefined} from './remove-undefined';

export const mergeArr = (a: Arr, b: Arr, cloneArr = true): Arr => {

  const arr: Arr = [];

  if (cloneArr) {
    a = clone(a);
    b = clone(b);
  }

  for (let i = 0; i < b.length; i++) {

    const itemA = a[i];
    const itemB = b[i];

    if (Array.isArray(itemA) && Array.isArray(itemB)) {
      arr.push(mergeArr(itemA, itemB, false));
    } else if (typeof itemA === 'object' && itemA !== null && typeof itemB === 'object' && itemB !== null) {
      arr.push(mergeData(itemA as Data, itemB as Data, false));
    } else if (itemB !== undefined) {

      if (itemB !== null && (Array.isArray(itemB) || typeof itemB === 'object')) {
        arr.push(removeUndefined(itemB));
      } else {
        arr.push(itemB);
      }
    }
  }

  return arr;
};
