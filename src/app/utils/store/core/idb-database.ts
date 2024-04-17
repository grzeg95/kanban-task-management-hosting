export class IdbDatabase {

  private static _IdbDatabases = new Map<string, IDBDatabase>();

  static getInstance(projectId: string, cb: (idbDatabase: IDBDatabase) => void, err?: (ev: Event) => void) {

    const instance = IdbDatabase._IdbDatabases.get(projectId);

    if (instance) {
      cb(instance);
      return;
    }

    const idbOpenDbRequest = indexedDB.open(projectId, 0);

    idbOpenDbRequest.onsuccess = function() {
      IdbDatabase._IdbDatabases.set(projectId, idbOpenDbRequest.result);
      cb(idbOpenDbRequest.result);
    }

    idbOpenDbRequest.onblocked = function(ev) {
      err?.(ev);
    }

    idbOpenDbRequest.onupgradeneeded = function(ev) {

      idbOpenDbRequest.result.onerror = function(ev) {
        err?.(ev);
      };

      idbOpenDbRequest.result.createObjectStore('documents', {
        keyPath: ['parentPath', 'id']
      });

      cb(idbOpenDbRequest.result);
    }

    idbOpenDbRequest.onerror = function(ev) {
      err?.(ev);
    }
  }
}
