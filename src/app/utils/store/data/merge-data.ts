import {clone} from './clone-value';
import {Data} from './data';

export const mergeData = (a: Data, b: Data, cloneData = true): Data => {

  const data: Data = {};

  if (cloneData) {
    a = clone(a);
    b = clone(b);
  }

  const usedKeys = new Set<string>();

  for (const key of Object.getOwnPropertyNames(b)) {

    const itemA = a[key];
    const itemB = b[key];

    if (Array.isArray(itemB) || itemB === null || typeof itemB === 'boolean' || typeof itemB === 'string' || typeof itemB === 'number') {
      data[key] = itemB;
      usedKeys.add(key);
    } else if (itemA !== null && typeof itemA === 'object' && itemB !== null && typeof itemB === 'object') {
      data[key] = mergeData(itemA as Data, itemB as Data, false);
      usedKeys.add(key);
    } else if (!!itemA && itemB === undefined) {
      usedKeys.add(key);
    }
  }

  for (const key of Object.getOwnPropertyNames(a)) {
    if (!usedKeys.has(key)) {
      data[key] = a[key];
    }
  }

  return data;
};
