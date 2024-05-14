import {Data, Observer, Unsubscribe} from '../data';
import {Document, DocumentSnapshot, DocumentSnapshotError} from '../objects'
import {WriteBatch, WriteBatchError} from '../storage';
import {getPathPartRegex} from '../utils';
import {CollectionReference} from './collection-reference';

export class DocumentReference {

  private static _extension = new Map<string, DocumentReference>();

  public readonly path: string;

  private constructor(
    public readonly parentReference: CollectionReference,
    public readonly id: string
  ) {
    this.path = [this.parentReference.path, id].join('/');
  }

  private static _createInstance(parentReference: CollectionReference, id: string) {
    const instance = new DocumentReference(parentReference, id);
    this._extension.set([parentReference.path, id].join('/'), instance);
    return instance;
  }

  static getInstance(parentReference: CollectionReference, id: string) {
    return DocumentReference._extension.get([parentReference.path, id].join('/')) || DocumentReference._createInstance(parentReference, id);
  }

  collection(id: string) {

    if (!getPathPartRegex().test(id)) {
      throw new Error('Collection id must have only small and big letters with numbers and -_');
    }

    return CollectionReference.getInstance(
      this.parentReference.storage,
      id,
      this
    );
  }

  get() {
    return Document.getInstance(this).snapshot();
  }

  snapshots(observer: Observer<DocumentSnapshot, DocumentSnapshotError>) {
    return Document.snapshots(this, observer);
  }

  create(data: Data): Promise<boolean>;
  create(data: Data, observer: Observer<boolean, WriteBatchError>): Unsubscribe;

  create(data: Data, observer?: Observer<boolean, WriteBatchError>): Promise<boolean> | Unsubscribe {
    const writeBatch = new WriteBatch(this.parentReference.storage);
    writeBatch.create(this, data);
    return writeBatch.commit(observer);
  }

  update(data: Data): Promise<boolean>;
  update(data: Data, observer: Observer<boolean, WriteBatchError>): Unsubscribe;

  update(data: Data, observer?: Observer<boolean, WriteBatchError>): Promise<boolean> | Unsubscribe {
    const writeBatch = new WriteBatch(this.parentReference.storage);
    writeBatch.update(this, data);
    return writeBatch.commit(observer);
  }

  set(data: Data): Promise<boolean>;
  set(data: Data, observer: Observer<boolean, WriteBatchError>): Unsubscribe;

  set(data: Data, observer?: Observer<boolean, WriteBatchError>): Promise<boolean> | Unsubscribe {
    const writeBatch = new WriteBatch(this.parentReference.storage);
    writeBatch.set(this, data);
    return writeBatch.commit(observer);
  }

  delete(): Promise<boolean>;
  delete(observer: Observer<boolean, WriteBatchError>): Unsubscribe;

  delete(observer?: Observer<boolean, WriteBatchError>): Promise<boolean> | Unsubscribe {
    const writeBatch = new WriteBatch(this.parentReference.storage);
    writeBatch.delete(this);
    return writeBatch.commit(observer);
  }
}
