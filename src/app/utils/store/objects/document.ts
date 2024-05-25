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
    public modifiedAt: Date | null
  ) {
  }

  private static _createInstance(documentReference: DocumentReference) {

    const document = new Document(
      documentReference,
      {},
      null,
      null
    );

    this._extension.set(documentReference, document);
    return document;
  }

  static getInstance(documentReference: DocumentReference) {
    return Document._extension.get(documentReference) || Document._createInstance(documentReference);
  }

  async get() {

    let document: Document;

    for (let i = 0; i < 5; i++) {

      try {
        document = await this.documentReference.parentReference.storage.getDocument(this.documentReference);
      } catch (e) {
        await this.documentReference.parentReference.storage.reloadAccess();
      }
    }

    return document!;
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

    const document = await this.get();

    return new DocumentSnapshot(
      document.documentReference.parentReference.storage,
      document.data,
      document.documentReference.id,
      document.documentReference.parentReference.path,
      document.createdAt,
      document.modifiedAt
    )
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
