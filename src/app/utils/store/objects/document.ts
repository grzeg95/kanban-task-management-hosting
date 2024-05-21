import {Data, Observer, Unsubscribe} from '../data';
import {DocumentReference} from '../references';
import {DocumentJSON} from './document-json';
import {DocumentSnapshot, DocumentSnapshotError} from './document-snapshot';

export class DocumentError extends Error {
}

export enum DocumentFields {
  id = 'q',
  data = 'w',
  parentPath = 'e',
  createdAt = 'r',
  modifiedAt = 't'
}

export class Document {

  private static _extension = new Map<DocumentReference, Document>();
  private _snapshotsObservers = new Map<Observer<DocumentSnapshot, DocumentSnapshotError>, Unsubscribe>();

  get exists() {
    return this.createdAt !== null;
  }

  private constructor(
    public readonly documentReference: DocumentReference,
    public data: Data,
    public createdAt: Date | null,
    public modifiedAt: Date | null,
    public got = false
  )  {
  }

  private static _createInstance(documentReference: DocumentReference) {

    const document = new Document(
      documentReference,
      {},
      null,
      null,
      false
    );

    this._extension.set(documentReference, document);
    return document;
  }

  static getInstance(documentReference: DocumentReference) {
    return Document._extension.get(documentReference) || Document._createInstance(documentReference);
  }

  async get() {
    return this.documentReference.parentReference.storage.getDocument(this.documentReference);
  }

  private _notifyObserver(observer: Observer<DocumentSnapshot, DocumentSnapshotError>) {

    this.snapshot().then((documentSnapshot) => {
      observer.next?.(documentSnapshot);
    }).catch((documentError: DocumentError) => {
      observer.error?.(documentError);
      this._snapshotsObservers.get(observer)?.();
    });
  }

  notifyObservers() {
    for (const [observer] of this._snapshotsObservers) {
      this._notifyObserver(observer);
    }
  }

  toJSON() {
    return {
      [DocumentFields.id]: this.documentReference.id,
      [DocumentFields.data]: this.data,
      [DocumentFields.parentPath]: this.documentReference.parentReference.path,
      [DocumentFields.createdAt]: this.createdAt ? this.createdAt.getTime() : this.createdAt,
      [DocumentFields.modifiedAt]: this.modifiedAt ? this.modifiedAt.getTime() : this.modifiedAt
    } as DocumentJSON;
  }

  async snapshot(): Promise<DocumentSnapshot> {

    const getDocumentSnapshot = (document: Document) => {
      return Promise.resolve(new DocumentSnapshot(
        this.documentReference.parentReference.storage,
        this.data,
        this.documentReference.id,
        this.documentReference.parentReference.path,
        this.createdAt,
        this.modifiedAt
      ));
    };

    if (this.got) {
      return getDocumentSnapshot(this);
    }

    return getDocumentSnapshot(await this.get());
  }

  static snapshots(documentReference: DocumentReference, observer: Observer<DocumentSnapshot, DocumentSnapshotError>): Unsubscribe {

    const document = Document.getInstance(documentReference);

    const unsubscribe = () => {
      observer.complete?.();
      document._snapshotsObservers.delete(observer);
    };

    document._snapshotsObservers.set(observer, unsubscribe);
    document._notifyObserver(observer);

    return unsubscribe;
  }
}
