export class IdbDatabaseRequest {}

export class IdbDatabaseResponse {}

export class IdbDatabaseResponseError {}

export class IdbDatabase {

  private static _IdbDatabases = new Map<string, IDBDatabase>();

  getInstance(projectId: string) {

    const instance = IdbDatabase._IdbDatabases.get(projectId);

    if (!instance) {
      return new Promise((resolve, reject) => {

        const idbOpenDbRequest = indexedDB.open(projectId, 0);

        idbOpenDbRequest.onsuccess = function(ev) {
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


          resolve(idbOpenDbRequest.result);
        }

        idbOpenDbRequest.onerror = function(ev) {
          reject(ev);
        }
      });
    }

    return instance;
  }

  request(projectId: string, IdbDatabaseRequest: IdbDatabaseRequest) {
    return new Promise<IdbDatabaseResponse>((resolve, reject) => {

    });
  }
}
