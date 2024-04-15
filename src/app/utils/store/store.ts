import {from, switchMap, throwError} from 'rxjs';
import {PendingOperations} from './pending-operations';
import {WriteBatch} from './write-batch';

export type Field = number | null | Array<any> | string | object;
export type FieldValue = {[key in string]: Field};

export class DocumentSnapshot {

  public readonly parentRef: CollectionRef;

  constructor(
    public readonly projectId: string,
    public readonly data: FieldValue,
    private readonly parentPath: string,
    public readonly createdAt: Date | null,
    public readonly modifiedAt: Date | null,
    public readonly exists: boolean
  ) {
    const store = new Store(projectId);
    this.parentRef = collection(store, parentPath);
  }
}

export type DocumentJSON = {
  projectId: string;
  data: FieldValue;
  parentPath: string;
  owner: string;
  createdAt: string;
  modifiedAt: string;
}

export class Document {

  constructor(
    public projectId: string,
    public data: FieldValue,
    public parentPath: string,
    public owner: string,
    public createdAt: Date | null,
    public modifiedAt: Date | null
  ) {
  }

  private static _isJSONDocument(json: any): boolean {

    const properties = Object.getOwnPropertyNames(json);

    return properties.toSet().hasOnly(['projectId', 'data', 'parentPath', 'owner', 'createdAt', 'modifiedAt'].toSet()) &&
      typeof json['projectId'] === 'string' &&
      typeof json['data'] === 'object' &&
      typeof json['parentPath'] === 'string' &&
      typeof json['owner'] === 'string' &&
      (!Number.isNaN(Date.parse(json['createdAt'])) || json['createdAt'] === null) &&
      (!Number.isNaN(Date.parse(json['modifiedAt'])) || json['modifiedAt'] === null);
  }

  static stringToDocument(documentRef: DocumentRef, documentString: string) {

    let documentJSON: DocumentJSON;

    try {
      documentJSON = JSON.parse(documentString) as DocumentJSON;
      if (Document._isJSONDocument(documentJSON)) {
        throw new Error('DocumentJSON is not valid');
      }
    } catch {
      localStorage.removeItem([documentRef.store.projectId, documentRef.path].join('/'));

      return new Document(
        documentRef.store.projectId,
        {},
        documentRef.parentRef.path,
        '',
        null,
        null
      );
    }

    return new Document(
      documentRef.store.projectId,
      documentJSON.data,
      documentRef.parentRef.path,
      '',
      documentJSON.createdAt ? new Date(documentJSON.createdAt) : null,
      documentJSON.createdAt ? new Date(documentJSON.createdAt) : null
    );
  }

  snapshot(): DocumentSnapshot {
    return new DocumentSnapshot(
      this.projectId,
      this.data,
      this.parentPath,
      this.createdAt,
      this.modifiedAt,
      this.createdAt !== null
    );
  }
}

export class CollectionRef {

  constructor(
    public readonly store: Store,
    public readonly path: string,
    public readonly id: string,
    public readonly parentRef: DocumentRef | null
  ) {}

  doc(id: string) {

    if (/^[a-zA-Z0-9]+$/.test(id)) {
      throw new Error('Document id must have only small and big letters with numbers');
    }

    return new DocumentRef(
      this.store,
      [this.path, id].join('/'),
      id,
      this
    );
  }
}

export class DocumentRef {

  constructor(
    public readonly store: Store,
    public readonly path: string,
    public readonly id: string,
    public readonly parentRef: CollectionRef
  ) {
  }

  collection(id: string) {

    if (/^[a-zA-Z0-9]+$/.test(id)) {
      throw new Error('Collection id must have only small and big letters with numbers');
    }

    return new CollectionRef(
      this.store,
      [this.path, id].join('/'),
      id,
      this
    );
  }

  get() {
    const documentString = localStorage.getItem([this.store.projectId, this.path].join('/')) || '';
    return Document.stringToDocument(this, documentString).snapshot();
  }

  create(data: FieldValue) {
    const writeBatch = new WriteBatch(this.store.projectId, '');
    writeBatch.create(this, data);
    return this._waitForRespond(writeBatch);
  }

  update(data: FieldValue) {
    const writeBatch = new WriteBatch(this.store.projectId, '');
    writeBatch.create(this, data);
    return this._waitForRespond(writeBatch);
  }

  set(data: FieldValue) {
    const writeBatch = new WriteBatch(this.store.projectId, '');
    writeBatch.set(this, data);
    return this._waitForRespond(writeBatch);
  }

  delete() {
    const writeBatch = new WriteBatch(this.store.projectId, '');
    writeBatch.delete(this);
    return this._waitForRespond(writeBatch);
  }

  private _waitForRespond(writeBatch: WriteBatch) {

    const pendingOperations = PendingOperations.getInstance(this.store.projectId);

    if (!pendingOperations) {
      return throwError(() => {
        return 'Please run pending operations of this project';
      });
    }

    return from(pendingOperations.enqueue(writeBatch)).pipe(
      switchMap((writeBatchId) => pendingOperations.getRespond(writeBatchId))
    );
  }
}

export class Store {
  constructor(
    public readonly projectId: string = '[DEFAULT]'
  ) {
  }
}

export function doc(store: Store, path: string): DocumentRef;
export function doc(collectionRef: CollectionRef, path: string): DocumentRef;

export function doc(storeOrCollectionRef: Store | CollectionRef, path: string): DocumentRef {

  const pathParts = path.split('/').filter((pathPart) => !!pathPart);

  if (pathParts.length % 2 !== 0 || pathParts.length === 0) {
    throw new Error(`Document path must have positive even number of parts`);
  }

  const store = storeOrCollectionRef instanceof Store ? storeOrCollectionRef : storeOrCollectionRef.store;

  let i = 0;
  let collectionRef = collection(store, pathParts[i]);
  let documentRef = collectionRef.doc(pathParts[i + 1]);

  for (; i < pathParts.length; i += 2) {
    collectionRef = documentRef.collection(pathParts[i]);
    documentRef = collectionRef.doc(pathParts[i + 1]);
  }

  return documentRef;
}

export function collection(store: Store, path: string): CollectionRef
export function collection(documentRef: DocumentRef, path: string): CollectionRef

export function collection(storeOrDocumentRef: Store | DocumentRef, path: string): CollectionRef {

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
