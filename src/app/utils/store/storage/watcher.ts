import {Observer, Queue, Unsubscribe} from '../data';
import {Storage} from './storage';
import {IdbDatabase, InMemory} from './storage-types';
import {PendingWriteBatchOperation, WriteBatch, WriteBatchError, WriteBatchOperation} from './write-batch';

export class Watcher {

  private static _extension = new Map<Storage, Watcher>();
  private _lock = false;
  private _pendingOperations = new Queue<WriteBatch, PendingWriteBatchOperation>();

  private constructor(
    private storage: Storage
  ) {
  }

  private static _createInstance(storage: Storage) {
    const watcher = new Watcher(storage);
    this._extension.set(storage, watcher);
    return watcher;
  }

  static getInstance(storage: Storage) {
    return Watcher._extension.get(storage) || Watcher._createInstance(storage);
  }

  rejectOperations() {

    let pendingOperation = this._pendingOperations.dequeue();

    while (pendingOperation) {
      pendingOperation.writeBatchOperations = [];
      pendingOperation.observer?.error?.(new WriteBatchError('Operation has been rejected'));
      pendingOperation = this._pendingOperations.dequeue();
    }
  }

  enqueue(writeBatch: WriteBatch, writeBatchOperations: WriteBatchOperation[]): Promise<boolean>;
  enqueue(writeBatch: WriteBatch, writeBatchOperations: WriteBatchOperation[], observer?: Observer<boolean, WriteBatchError>): Unsubscribe;

  enqueue(writeBatch: WriteBatch, writeBatchOperations: WriteBatchOperation[], observer?: Observer<boolean, WriteBatchError>) {

    setTimeout(() => this._makeOperation());

    if (observer) {
      this._pendingOperations.enqueue(writeBatch, {writeBatchOperations, writeBatch, observer});
      return () => {
        this._pendingOperations.removeItem(writeBatch);
      };
    }

    return new Promise((resolve, reject) => {

      this._pendingOperations.enqueue(writeBatch, {
        writeBatchOperations, writeBatch, observer: {
          next: resolve,
          error: reject
        }
      });
    });
  }

  private async _makeOperation() {
    if (this._lock) {
      return;
    } else {
      this._lock = true;

      if (this._pendingOperations.size > 0) {

        const pendingOperation = this._pendingOperations.dequeue()!;
        const writeBatchOperations = pendingOperation.writeBatchOperations;
        const observer = pendingOperation.observer;
        const writeBatch = pendingOperation.writeBatch;

        let runWriteBatchPromise;

        if (this.storage.constructor.name.includes(InMemory.name)) {
          runWriteBatchPromise = InMemory.runWriteBatch(this.storage as InMemory, writeBatch, writeBatchOperations);
        }

        if (this.storage.constructor.name.includes(IdbDatabase.name)) {
          runWriteBatchPromise = IdbDatabase.runWriteBatch(this.storage as IdbDatabase, writeBatch, writeBatchOperations);
        }

        await runWriteBatchPromise!.then((writeBatchRespond: boolean) => {
          observer.next?.(writeBatchRespond);
        }).catch((writeBatchError: WriteBatchError) => {
          console.log(writeBatchError);
          observer.error?.(writeBatchError);
        }).finally(() => {
          this._lock = false;
          this._makeOperation();
          observer.complete?.();
        });
      } else {
        this._lock = false;
      }
    }
  }
}
