import {filter, map, Subject} from 'rxjs';
import {Queue} from './queue';
import {WriteBatch, WriteBatchRespond} from './write-batch';

export class PendingOperations {

  private static _pendingOperationsInstances = new Map<string, PendingOperations>();
  private _notifyRespondsById = new Subject<string>();
  private _writeBatchResponds = new Map<string, WriteBatchRespond | null>();
  private _lock = false;
  private _pendingOperations = new Queue<WriteBatch>();

  private constructor(
    public projectId: string
  ) {
  }

  static createInstance(projectId: string) {

    let pendingOperations = PendingOperations._pendingOperationsInstances.get(projectId);

    if (pendingOperations) {
      return pendingOperations;
    }

    pendingOperations = new PendingOperations(projectId);
    this._pendingOperationsInstances.set(projectId, pendingOperations);

    return pendingOperations;
  }

  static getInstance(projectId: string) {
    return PendingOperations._pendingOperationsInstances.get(projectId);
  }

  enqueue(writeBatch: WriteBatch) {
    return new Promise<string>((resolve) => {
      const _id = writeBatch.id;
      this._writeBatchResponds.set(_id, null);
      this._pendingOperations.enqueue(writeBatch);
      this._makeOperation();
      resolve(_id);
    });
  }

  private _makeOperation() {
    if (this._lock) {
      return;
    } else {
      if (this._pendingOperations.size) {

        this._lock = true;
        const writeBatch = this._pendingOperations.dequeue();

        if (writeBatch) {
          writeBatch.commit().then((writeBatchRespond) => {
            this._writeBatchResponds.set(writeBatchRespond.id, writeBatchRespond);
            this._lock = false;
            this._notifyRespondsById.next(writeBatchRespond.id);
            this._makeOperation();
          });
        }
      }
    }
  }

  getRespond(writeBatchId: string) {
    return this._notifyRespondsById.pipe(
      filter((notifyRespondId) => notifyRespondId === writeBatchId),
      map((notifyRespondId) => {
        const respond = this._writeBatchResponds.get(notifyRespondId);
        this._writeBatchResponds.delete(notifyRespondId);
        return respond;
      })
    );
  }
}
