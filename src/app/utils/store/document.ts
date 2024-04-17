import {id} from '../id';
import {collection, CollectionRef} from './collection';
import {FieldValue} from './core/data';
import {IdbDatabase} from './core/idb-database';
import {PendingOperations} from './core/pending-operations';
import {WriteBatch} from './core/write-batch';
import {Store} from './store';

export class DocumentSnapshot {

  public readonly parentRef: CollectionRef;
  public readonly ref: DocumentReference;

  constructor(
    public readonly projectId: string,
    public readonly data: FieldValue,
    public readonly id: string,
    private readonly parentPath: string,
    public readonly createdAt: Date | null,
    public readonly modifiedAt: Date | null,
    public readonly exists: boolean
  ) {
    const store = new Store(projectId);
    this.parentRef = collection(store, parentPath);
    this.ref = doc(this.parentRef, this.id)
  }
}

export type DocumentJSON = {
  projectId: string;
  data: FieldValue;
  parentPath: string;
  owner: string;
  createdAt: string;
  modifiedAt: string;
  id: string;
}

export type StoreError = NonNullable<unknown>;

export type DocumentObserver = {
  next: (snapshot: DocumentSnapshot) => void;
  error?: (error: StoreError) => void;
  complete?: () => void;
  unsubscribe?: () => void;
}

export class Document {

  private static _Documents = new Map<string, Document>();
  private _observers = new Map<string, DocumentObserver>();

  get exists() {
    return this.createdAt !== null;
  }

  private constructor(
    public projectId: string,
    public data: FieldValue,
    public parentPath: string,
    public owner: string,
    public createdAt: Date | null,
    public modifiedAt: Date | null,
    public id: string
  ) {
  }

  private static _get(documentRef: DocumentReference, documentsStore: IDBObjectStore, stopTransaction: boolean, cb: (document: Document) => void) {

    const query = [documentRef.parentRef.path, documentRef.id];
    const index = query.join('|');
    const documentCursorRequest = documentsStore!.openCursor(query);

    documentCursorRequest.onsuccess = function () {

      const documentTmp = Document._anyToDocument(documentRef, documentCursorRequest.result?.value, documentsStore!, true);
      let document: Document;

      if (Document._Documents.has(index)) {
        document = Document._Documents.get(index)!;
        document.data = documentTmp.data;
        document.createdAt = documentTmp.createdAt;
        document.modifiedAt = documentTmp.modifiedAt;
      } else {
        document = documentTmp;
        Document._Documents.set(index, document);
      }

      if (stopTransaction) {
        documentsStore!.transaction.commit();
      }

      cb(document);
    }

    documentCursorRequest.onerror = function () {

      const document = Document._anyToDocument(documentRef, null, documentsStore!);

      if (stopTransaction) {
        documentsStore!.transaction.commit();
      }

      if (!Document._Documents.has(index)) {
        Document._Documents.set(index, document);
      }

      cb(document);
    }
  }

  static get(documentRef: DocumentReference, documentsStore: IDBObjectStore | undefined, cb: (document: Document) => void) {
    if (!documentsStore) {
      IdbDatabase.getInstance(documentRef.store.projectId, (idbDatabase) => {
        const transaction = idbDatabase.transaction('documents', 'readwrite');
        documentsStore = transaction.objectStore('documents');
        Document._get(documentRef, documentsStore, true, cb);
      });
    } else {
      Document._get(documentRef, documentsStore, false, cb);
    }
  }

  notifyObserver(id: string) {
    this._observers.get(id)?.next(this.snapshot());
  }

  notifyObservers() {
    for (const [id] of this._observers) {
      this.notifyObserver(id);
    }
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

  private static _anyToDocument(documentRef: DocumentReference, documentAny: any, documentsStore: IDBObjectStore, destroy: boolean = false) {

    if (typeof documentAny !== 'object' || !documentAny || !Document._isJSONDocument(documentAny)) {

      if (destroy) {
        documentsStore.delete([documentRef.id, documentRef.parentRef.path]);
      }

      return new Document(
        documentRef.store.projectId,
        {},
        documentRef.parentRef.path,
        '',
        null,
        null,
        documentRef.id
      );
    }

    const documentJSON = documentAny as DocumentJSON;

    return new Document(
      documentRef.store.projectId,
      documentJSON.data,
      documentRef.parentRef.path,
      '',
      documentJSON.createdAt ? new Date(documentJSON.createdAt) : null,
      documentJSON.createdAt ? new Date(documentJSON.createdAt) : null,
      documentRef.id
    );
  }

  toJSON() {
    return {
      projectId: this.projectId,
      data: this.data,
      parentPath: this.parentPath,
      owner: this.owner,
      createdAt: this.createdAt ? this.createdAt.toString() : this.createdAt,
      modifiedAt: this.modifiedAt ? this.modifiedAt.toString() : this.modifiedAt,
      id: this.id
    } as DocumentJSON;
  }

  snapshot() {
    return new DocumentSnapshot(
      this.projectId,
      this.data,
      this.id,
      this.parentPath,
      this.createdAt,
      this.modifiedAt,
      this.exists
    );
  }

  private _unsubscribe(id: string) {
    this._observers.delete(id);
  }

  static snapshots(documentReference: DocumentReference, documentObserver: DocumentObserver) {

    Document.get(documentReference, undefined, (document) => {

      const _id = id([...document._observers.keys()].toSet());
      documentObserver.next(document.snapshot());
      document._observers.set(_id, documentObserver);

      documentObserver.unsubscribe = () => {
        documentObserver.unsubscribe?.();
        document._unsubscribe(_id);
      };
    });
  }
}

export class DocumentReference {

  private static _DocumentReferences = new Map<string, DocumentReference>();

  private constructor(
    public readonly store: Store,
    public readonly path: string,
    public readonly id: string,
    public readonly parentRef: CollectionRef
  ) {
  }

  static getInstance(store: Store, path: string, id: string, parentRef: CollectionRef) {

    let documentReference = DocumentReference._DocumentReferences.get(path);

    if (!documentReference) {
      documentReference = new DocumentReference(store, path, id, parentRef);
      DocumentReference._DocumentReferences.set(path, documentReference);
    }

    return documentReference;
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
    return new Promise<DocumentSnapshot>((resolve) => {
      Document.get(this, undefined, (document) => {
        resolve(document.snapshot())
      })
    });
  }

  snapshots(observer: DocumentObserver) {
    Document.snapshots(this, observer);
    return {
      unsubscribe: observer.unsubscribe!
    };
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

export function doc(store: Store, path: string): DocumentReference;
export function doc(collectionRef: CollectionRef, path: string): DocumentReference;

export function doc(storeOrCollectionRef: Store | CollectionRef, path: string): DocumentReference {

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
