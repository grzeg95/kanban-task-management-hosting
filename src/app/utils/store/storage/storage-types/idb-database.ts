import {mergeData, Observer, Unsubscribe} from '../../data';
import {doc, Document, DocumentFields, DocumentJSON} from '../../objects';
import {CollectionReference, DocumentReference} from '../../references';
import {Storage, StoreNames} from '../storage';
import {WriteBatch, WriteBatchError, WriteBatchOperation, WriteBatchOperationType} from '../write-batch';

export type IdbDatabaseAccess = {
  idbDatabase: IDBDatabase;
};

export class IdbDatabase extends Storage {

  private static readonly _extension = new Map<string, IdbDatabase>();
  private _registeredWriteBatches = new Set<WriteBatch>();

  private constructor(
    public override readonly projectId: string,
    private readonly _access: IdbDatabaseAccess
  ) {
    super(projectId);
  }

  private _deleteDatabase() {
    return new Promise<void>((resolve, reject) => {

      const idbOpenDbRequest = indexedDB.deleteDatabase(this.projectId);

      idbOpenDbRequest.onsuccess = () => {
        resolve();
      };

      idbOpenDbRequest.onerror = (ev) => {
        reject(ev);
      };
    });
  }

  private static _createInstance(projectId: string) {

    return new Promise<IdbDatabase>((resolve, reject) => {

      const idbOpenDbRequest = indexedDB.open(projectId, 1);

      idbOpenDbRequest.onsuccess = function () {
        const idbDatabase = idbOpenDbRequest.result;
        resolve(new IdbDatabase(projectId, {idbDatabase}));
      }

      idbOpenDbRequest.onblocked = function (ev) {
        reject(ev);
      }

      idbOpenDbRequest.onupgradeneeded = function () {

        const idbDatabase = idbOpenDbRequest.result;

        idbDatabase.onerror = function (ev) {
          reject(ev);
        };

        const objectStore = idbDatabase.createObjectStore(StoreNames.documents, {
          keyPath: [DocumentFields.parentPath, DocumentFields.id]
        });

        objectStore.createIndex(DocumentFields.parentPath, [DocumentFields.parentPath]);

        resolve(new IdbDatabase(projectId, {idbDatabase}));
      }

      idbOpenDbRequest.onerror = function (ev) {
        reject(ev);
      }
    });
  }

  static getInstance(projectId: string) {

    const instance = IdbDatabase._extension.get(projectId)

    return instance ? Promise.resolve(instance) : IdbDatabase._createInstance(projectId);
  }

  private _getTransaction(writeBatch: WriteBatch) {

    if (this._registeredWriteBatches.has(writeBatch)) {
      return this._access.idbDatabase.transaction(StoreNames.documents, 'readwrite');
    }

    throw `This write batch wasn't registered`;
  }

  getDocument(documentReference: DocumentReference, documentsStore?: IDBObjectStore): Promise<Document> {

    return new Promise<Document>((resolve) => {

      const stopTransaction = !documentsStore;

      if (!documentsStore) {
        const transaction = this._access.idbDatabase.transaction(StoreNames.documents, 'readonly');
        documentsStore = transaction.objectStore(StoreNames.documents);
      }

      const query = [
        documentReference.parentReference.path,
        documentReference.id
      ];

      const cursor = documentsStore.openCursor(query);

      cursor.onsuccess = () => {

        if (stopTransaction) {
          documentsStore!.transaction.commit();
        }

        resolve(IdbDatabase.getDocumentFromDocumentJSON(documentReference, cursor.result?.value));
      };

      cursor.onerror = () => {

        if (stopTransaction) {
          documentsStore!.transaction.commit();
        }

        resolve(IdbDatabase.getDocumentFromDocumentJSON(documentReference, cursor.result?.value));
      };
    });
  }

  private _registerWriteBatch(writeBatch: WriteBatch) {
    this._registeredWriteBatches.add(writeBatch);
  }

  private _unregisterWriteBatch(writeBatch: WriteBatch) {
    this._registeredWriteBatches.delete(writeBatch);
  }

  static async runWriteBatch(idbDatabase: IdbDatabase, writeBatch: WriteBatch, writeBatchOperations: WriteBatchOperation[]) {

    idbDatabase._registerWriteBatch(writeBatch);

    const maxIterations = 5;
    let result: boolean;

    for (let currentIteration = 0; currentIteration < maxIterations; ++currentIteration) {

      try {

        const date = new Date();

        const transaction = idbDatabase._getTransaction(writeBatch);
        const documentsStore = transaction.objectStore(StoreNames.documents);

        transaction.onerror = function () {
          throw new WriteBatchError('idbDatabase transaction error');
        }

        for (const writeBatchOperation of writeBatchOperations) {
          writeBatchOperation.documentPromise = idbDatabase.getDocument(writeBatchOperation.documentReference, documentsStore);
        }

        for (const writeBatchOperation of writeBatchOperations) {

          const document = await writeBatchOperation.documentPromise!;

          if (writeBatchOperation.type === WriteBatchOperationType.create) {

            if (document.exists) {
              transaction.abort();
              throw new WriteBatchError(`WriteBatch detected that ${writeBatchOperation.documentReference.id} document exists but was to be created`);
            }

            document.createdAt = date;
            document.modifiedAt = date;
            document.data = writeBatchOperation.data!;
            documentsStore.add(document.toJSON());
          }

          if (writeBatchOperation.type === WriteBatchOperationType.set) {

            document.modifiedAt = date;
            document.data = writeBatchOperation.data!;

            if (document.exists) {
              documentsStore.put(document.toJSON());
            } else {
              documentsStore.add(document.toJSON());
            }
          }

          if (writeBatchOperation.type === WriteBatchOperationType.update) {

            if (!document.exists) {
              transaction.abort();
              throw new WriteBatchError(`WriteBatch detected that ${document.documentReference.id} document doesn't exist but was to be updated`);
            }

            document.modifiedAt = date;
            document.data = mergeData(document.data, writeBatchOperation.data!);

            documentsStore.put(document.toJSON());
          }

          if (writeBatchOperation.type === WriteBatchOperationType.delete) {

            if (document.exists) {
              transaction.abort();
              throw new WriteBatchError(`WriteBatch detected that ${document.documentReference.id} doesn't exist but was to be deleted`);
            }

            const query = [
              document.documentReference.parentReference.path,
              document.documentReference.id
            ];

            documentsStore.delete(query);
          }
        }

        transaction.commit();

        result = await new Promise<boolean>((resolve, reject) => {

          transaction.oncomplete = async () => {

            // reload document

            for (const operation of writeBatchOperations) {
              operation.documentPromise = idbDatabase.getDocument(operation.documentReference);
            }

            for (const operation of writeBatchOperations) {
              operation.document = await operation.documentPromise!;
            }

            for (const operation of writeBatchOperations) {
              operation.document!.notifyObservers();
              idbDatabase.notifyRegisteredGetDocuments(operation.document!.documentReference.parentReference);
            }

            resolve(true);
          }

          transaction.onerror = function () {
            reject(false);
          }
        });

        if (result) {
          break;
        }

      } catch (error) {

        if (error instanceof DOMException && error.NOT_FOUND_ERR) {
          await idbDatabase._deleteDatabase();
          idbDatabase = await IdbDatabase.getInstance(idbDatabase.projectId);
          continue;
        }

        if (currentIteration === maxIterations - 1) {
          idbDatabase._unregisterWriteBatch(writeBatch);
          throw error as WriteBatchError;
        }
      }
    }

    idbDatabase._unregisterWriteBatch(writeBatch);
    return result!;
  }

  getDocuments(collectionReference: CollectionReference): Promise<Document[]>;
  getDocuments(collectionReference: CollectionReference, observer: Observer<Document[], Error>): Unsubscribe;

  getDocuments(collectionReference: CollectionReference, observer?: Observer<Document[], Error>): Promise<Document[]> | Unsubscribe {

    const transaction = this._access.idbDatabase.transaction(StoreNames.documents, 'readonly');
    const documentsStore = transaction.objectStore(StoreNames.documents);
    const query = [collectionReference.path];
    const index = documentsStore.index(DocumentFields.parentPath);
    const idbRequest = index.getAll(query);

    if (observer) {

      const observers = this._registeredGetDocuments.get(collectionReference) || new Map<Observer<Document[], Error>, Unsubscribe>();

      const unsubscribe = () => {
        const observers = this._registeredGetDocuments.get(collectionReference);

        if (observers) {
          observers.delete(observer);

          if (observers.size === 0) {
            this._registeredGetDocuments.delete(collectionReference);
          }
        }

        observer.complete?.();
      };

      observers.set(observer, unsubscribe);
      this._registeredGetDocuments.set(collectionReference, observers);

      idbRequest.onerror = () => {
        observer.error?.(idbRequest.error as DOMException);
      };

      idbRequest.onsuccess = () => {

        const documentJSONs = idbRequest.result as DocumentJSON[];
        const documents: Document[] = [];

        for (const documentJSON of documentJSONs) {
          const documentReference = doc(this, [documentJSON[DocumentFields.parentPath], documentJSON[DocumentFields.id]].join('/'));
          documents.push(IdbDatabase.getDocumentFromDocumentJSON(documentReference, documentJSON));
        }

        observer.next?.(documents);
      };

      return unsubscribe;
    }

    return new Promise<Document[]>((resolve, reject) => {

      idbRequest.onerror = () => {
        reject(idbRequest.error as DOMException);
      };

      idbRequest.onsuccess = () => {

        const documentJSONs = idbRequest.result as DocumentJSON[];
        const documents: Document[] = [];

        for (const documentJSON of documentJSONs) {
          const documentReference = doc(this, [documentJSON[DocumentFields.parentPath], documentJSON[DocumentFields.id]].join('/'));
          documents.push(IdbDatabase.getDocumentFromDocumentJSON(documentReference, documentJSON));
        }

        resolve(documents);
      };
    });
  }

  async clear() {
    await this._deleteDatabase();
    await IdbDatabase._createInstance(this.projectId);
  }
}

export function getIdbDatabase(projectId: string) {
  return IdbDatabase.getInstance(projectId);
}
