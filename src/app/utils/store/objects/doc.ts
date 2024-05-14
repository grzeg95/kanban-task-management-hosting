import {CollectionReference, DocumentReference} from '../references';
import {Storage} from '../storage';
import {getPathParts} from '../utils';
import {collection} from './collection';

export function doc(storage: Storage, path: string): DocumentReference;
export function doc(collectionReference: CollectionReference, path: string): DocumentReference;

export function doc(storageOrCollectionReference: Storage | CollectionReference, path: string): DocumentReference {

  const pathParts = getPathParts(path);
  let collectionRef: CollectionReference;
  let i = 0;

  if (storageOrCollectionReference.constructor.name.includes('CollectionReference')) {

    if (pathParts.length % 2 === 0) {
      throw new Error(`Document path must have odd number of parts`);
    }
    collectionRef = storageOrCollectionReference as CollectionReference;

  } else {

    if (pathParts.length === 1) {
      collectionRef = collection(storageOrCollectionReference as Storage, pathParts[i]);
      return collectionRef.doc();
    }

    if (pathParts.length % 2 !== 0) {
      throw new Error(`Document path must have even number of parts`);
    }
    collectionRef = collection(storageOrCollectionReference as Storage, pathParts[i]);
    ++i;
  }

  let documentReference = collectionRef.doc(pathParts[i]);
  ++i;

  for (; i < pathParts.length; i += 2) {
    collectionRef = documentReference.collection(pathParts[i]);
    documentReference = collectionRef.doc(pathParts[i + 1]);
  }

  return documentReference;
}
