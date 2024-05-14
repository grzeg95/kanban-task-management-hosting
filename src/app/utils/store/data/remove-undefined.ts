import {Data, Value} from './data';

export const removeUndefined = (dataOrArr: Data | Omit<Value, 'Primitive'> | Omit<Value, 'Primitive'>[]): Data | Omit<Value, 'Primitive'> | Omit<Value, 'Primitive'>[] => {

  if (Array.isArray(dataOrArr)) {

    const arr = [];
    for (let i = 0; i < dataOrArr.length; ++i) {

      const item = dataOrArr[i];

      if (item !== undefined) {
        if (item !== null && (Array.isArray(item) || typeof item === 'object')) {
          arr.push(removeUndefined(item));
        } else {
          arr.push(item);
        }
      }
    }
    return arr;
  }

  const data: Data = {};

  for (const key of Object.getOwnPropertyNames(dataOrArr as Data)) {

    const item = (dataOrArr as Data)[key];

    if (item !== undefined) {
      if (item !== null && (Array.isArray(item) || typeof item === 'object')) {
        data[key] = removeUndefined(item);
      } else {
        data[key] = item;
      }
    }
  }

  return data;
}
