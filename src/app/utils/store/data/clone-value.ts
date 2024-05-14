import {Value, Data, Arr} from './data';

export const clone = <T extends Value>(a: T): T => {

  if (
    a === undefined ||
    a === null ||
    typeof a === 'boolean' ||
    typeof a === 'string' ||
    typeof a === 'number'
  ) {
    return a;
  }

  if (Array.isArray(a)) {

    const arr: Arr = [];

    for (let i = 0; i < a.length; i++) {
      arr.push(clone(a[i]));
    }

    return arr as T;
  }

  const obj: Data = {};
  for (const key of Object.getOwnPropertyNames(a)) {
    obj[key] = clone(a[key]);
  }

  return obj as T;
};
