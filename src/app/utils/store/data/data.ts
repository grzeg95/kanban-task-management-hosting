export type Primitive = undefined | null | boolean | number | string;

export type Data = {
  [key: string]: Value | Arr;
};

export type Value = Data | Primitive | (Data[] | Value[] | (Data | Value)[] | (Data[] | Value)[] | (Data | Value[])[] | (Data[] | Value[])[]);

export type Arr = Value[];
