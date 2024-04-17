export class IdbDatabase {

  private static _IdbDatabases = new Map<string, IDBDatabase>();

  static async getInstance(projectId: string) {

    const instance = IdbDatabase._IdbDatabases.get(projectId);

    if (!instance) {
      return new Promise<IDBDatabase>((resolve, reject) => {

        const idbOpenDbRequest = indexedDB.open(projectId, 0);

        idbOpenDbRequest.onsuccess = function() {
          IdbDatabase._IdbDatabases.set(projectId, idbOpenDbRequest.result);
          resolve(idbOpenDbRequest.result);
        }

        idbOpenDbRequest.onblocked = function(ev) {
          reject(ev);
        }

        idbOpenDbRequest.onupgradeneeded = function(ev) {

          idbOpenDbRequest.result.onerror = function(ev) {
            reject(ev);
          };

          idbOpenDbRequest.result.createObjectStore('documents', {
            keyPath: ['parentPath', 'id']
          });

          resolve(idbOpenDbRequest.result);
        }

        idbOpenDbRequest.onerror = function(ev) {
          reject(ev);
        }
      });
    }

    return instance;
  }
}
