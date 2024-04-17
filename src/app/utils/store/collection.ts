import {doc, DocumentReference} from './document';
import {Store} from './store';

export class CollectionRef {

  constructor(
    public readonly store: Store,
    public readonly path: string,
    public readonly id: string,
    public readonly parentRef: DocumentReference | null
  ) {}

  doc(id: string) {

    if (/^[a-zA-Z0-9]+$/.test(id)) {
      throw new Error('Document id must have only small and big letters with numbers');
    }

    return DocumentReference.getInstance(this.store, [this.path, id].join('/'), id, this);
  }
}

export function collection(store: Store, path: string): CollectionRef;
export function collection(documentRef: DocumentReference, path: string): CollectionRef;

export function collection(storeOrDocumentRef: Store | DocumentReference, path: string): CollectionRef {

  const pathParts = path.split('/');

  if (pathParts.length %2 !== 0 || !pathParts.length) {
    throw new Error(`Collection path must have positive odd number of parts`);
  }

  const store = storeOrDocumentRef instanceof Store ? storeOrDocumentRef : storeOrDocumentRef.store;

  let i = 0;
  let collectionRef = new CollectionRef(store, pathParts[i], pathParts[i], null);
  ++i;

  for (; i < pathParts.length; i += 2) {
    const documentRef = doc(collectionRef, pathParts[i]);
    collectionRef = documentRef.collection(pathParts[i + 1]);
  }

  return collectionRef;
}
