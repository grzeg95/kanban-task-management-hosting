import {Data, Observer, Unsubscribe} from '../data';
import {Document} from '../objects';
import {DocumentReference} from '../references';
import {Storage, Watcher} from './index';

export class WriteBatchError extends Error {
}

export enum WriteBatchOperationType {
  create,
  set,
  update,
  delete
}

export type WriteBatchOperation = {
  type: WriteBatchOperationType;
  documentReference: DocumentReference;
  data?: Data;
  documentPromise?: Promise<Document>;
  document?: Document;
}

export type PendingWriteBatchOperation = {
  writeBatch: WriteBatch;
  writeBatchOperations: WriteBatchOperation[];
  observer: Observer<boolean, WriteBatchError>
}

export class WriteBatch {

  private _operations: WriteBatchOperation[] = [];

  constructor(
    public readonly storage: Storage
  ) {
  }

  clear() {
    this._operations = [];
  }

  commit(): Promise<boolean>;
  commit(observer?: Observer<boolean, WriteBatchError>): Unsubscribe;

  commit(observer?: Observer<boolean, WriteBatchError>): Promise<boolean> | Unsubscribe {
    return Watcher.getInstance(this.storage).enqueue(this, this._operations, observer);
  }

  create(documentReference: DocumentReference, data: Data) {
    this._operations.push({
      type: WriteBatchOperationType.create,
      documentReference: documentReference,
      data
    });
  }

  set(documentReference: DocumentReference, data: Data) {
    this._operations.push({
      type: WriteBatchOperationType.set,
      documentReference: documentReference,
      data
    });
  }

  update(documentReference: DocumentReference, data: Data) {
    this._operations.push({
      type: WriteBatchOperationType.update,
      documentReference: documentReference,
      data
    });
  }

  delete(documentReference: DocumentReference) {
    this._operations.push({
      type: WriteBatchOperationType.delete,
      documentReference: documentReference
    });
  }

  deleteAll(documentReferences: DocumentReference[]) {

    for (const documentReference of documentReferences) {
      this.delete(documentReference);
    }
  }
}
