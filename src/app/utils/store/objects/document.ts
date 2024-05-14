import {Data, Observer, Unsubscribe} from '../data';
import {DocumentReference} from '../references';
import {DocumentJSON} from './document-json';
import {DocumentSnapshot, DocumentSnapshotError} from './document-snapshot';

export class DocumentError extends Error {
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
    console.log(this._extension);
    return document;
  }

  static getInstance(documentReference: DocumentReference) {

    console.log();

    return Document._extension.get(documentReference) || Document._createInstance(documentReference);
  }

  async get() {
    return this.documentReference.parentReference.storage.getDocument(this.documentReference);
  }

  private _notifyObserver(observer: Observer<DocumentSnapshot, DocumentSnapshotError>) {

    console.log('_notifyObserver');

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
      id: this.documentReference.id,
      path: this.documentReference.path,
      storageType: this.documentReference.parentReference.storage.constructor.name,
      projectId: this.documentReference.parentReference.storage.projectId,
      data: this.data,
      parentPath: this.documentReference.parentReference.path,
      createdAt: this.createdAt ? this.createdAt.toString() : this.createdAt,
      modifiedAt: this.modifiedAt ? this.modifiedAt.toString() : this.modifiedAt,
      exists: !!this.createdAt
    } as DocumentJSON;
  }

  async snapshot(): Promise<DocumentSnapshot> {

    if (this.got) {
      return Promise.resolve(new DocumentSnapshot(
        this.documentReference.parentReference.storage,
        this.data,
        this.documentReference.id,
        this.documentReference.parentReference.path,
        this.createdAt,
        this.modifiedAt
      ));
    }

    const document = await this.get();

    return Promise.resolve(new DocumentSnapshot(
      document.documentReference.parentReference.storage,
      document.data,
      document.documentReference.id,
      document.documentReference.parentReference.path,
      document.createdAt,
      document.modifiedAt
    ));
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
