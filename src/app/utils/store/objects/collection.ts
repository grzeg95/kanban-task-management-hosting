import {Observer, Unsubscribe} from '../data';
import {CollectionReference, DocumentReference} from '../references';
import {Storage} from '../storage';
import {getPathParts} from '../utils';
import {doc} from './doc';
import {DocumentSnapshot, DocumentSnapshotError} from './document-snapshot';

export function collection(storage: Storage, path: string): CollectionReference;
export function collection(documentReference: DocumentReference, path: string): CollectionReference;

export function collection(storageArgOrDocumentReference: Storage | DocumentReference, path: string): CollectionReference {

  let pathParts = getPathParts(path);
  let storage: Storage;

  if (pathParts.length % 2 === 0) {
    throw new Error(`Collection path must have odd number of parts`);
  }

  if (storageArgOrDocumentReference.constructor.name.includes('DocumentReference')) {
    pathParts = [...(storageArgOrDocumentReference as DocumentReference).path.split('/'), ...pathParts];
    storage = (storageArgOrDocumentReference as DocumentReference).parentReference.storage;
  } else {
    pathParts = [...[(storageArgOrDocumentReference as Storage).projectId, storageArgOrDocumentReference.constructor.name], ...pathParts];
    storage = storageArgOrDocumentReference as Storage;
  }

  let i = 0;
  let collectionRef = CollectionReference.getInstance(storage, pathParts[i], null);
  ++i;

  for (; i < pathParts.length; i += 2) {
    const documentRef = doc(collectionRef, pathParts[i]);
    collectionRef = documentRef.collection(pathParts[i + 1]);
  }

  return collectionRef;
}

export function collectionSnapshot(collectionReference: CollectionReference): Promise<DocumentSnapshot[]>;
export function collectionSnapshot(collectionReference: CollectionReference, observer: Observer<DocumentSnapshot[], DocumentSnapshotError>): Unsubscribe;

export function collectionSnapshot(collectionReference: CollectionReference, observer?: Observer<DocumentSnapshot[], DocumentSnapshotError>): Promise<DocumentSnapshot[]> | Unsubscribe {
  return collectionReference.snapshot(observer);
}

export function collectionSnapshots(collectionReference: CollectionReference, observer: Observer<DocumentSnapshot[], DocumentSnapshotError>): Unsubscribe {
  return collectionReference.snapshots(observer);
}
