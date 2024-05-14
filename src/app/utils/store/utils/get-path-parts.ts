import {getPathPartRegex} from './get-path-part-regex';

export function getPathParts(path: string) {

  const pathParts = path.trim().split('/');

  for (let i = pathParts.length - 1; i >= 0; --i) {
    if (!getPathPartRegex().test(pathParts[i])) {
      throw new Error(`Path must be in format: a,b: [a-zA-Z0-9-_] [a[/b]]...`);
    }
  }

  return pathParts;
}
