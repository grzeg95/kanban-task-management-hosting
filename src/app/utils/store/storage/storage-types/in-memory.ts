import {mergeData, Observer, Unsubscribe} from '../../data';
import {doc, Document, DocumentJSON} from '../../objects'
import {CollectionReference, DocumentReference} from '../../references';
import {Storage} from '../storage';
import {WriteBatch, WriteBatchError, WriteBatchOperation, WriteBatchOperationType} from '../write-batch';
import {IdbDatabase} from './idb-database';

export type InMemoryAccess = {
  documents: Map<string, DocumentJSON>;
  collections: Map<string, Set<string>>;
}

export class InMemory extends Storage {

  private static readonly _extension = new Map<string, InMemory>();
  private _registeredWriteBatches = new Set<WriteBatch>();

  private constructor(
    public override readonly projectId: string,
    private readonly _access: InMemoryAccess
  ) {
    super(projectId);
  }

  private static _createInstance(projectId: string, cb: (inMemory: InMemory) => void) {
    cb(new InMemory(projectId, {
      documents: new Map<string, DocumentJSON>,
      collections: new Map<string, Set<string>>
    }));
  }

  static getInstance(projectId: string, cb: (inMemory: InMemory) => void) {

    const inMemory = InMemory._extension.get(projectId);

    return inMemory ? cb(inMemory) : InMemory._createInstance(projectId, cb);
  }

  setCollection(documentParentPath: string, set: Set<string>, writeBatch: WriteBatch) {

    if (this._registeredWriteBatches.has(writeBatch)) {
      this._access.collections.set(documentParentPath, set);
      return;
    }

    throw `This write batch wasn't registered`;
  }

  getCollection(documentParentPath: string, writeBatch: WriteBatch) {

    if (this._registeredWriteBatches.has(writeBatch)) {
      return this._access.collections.get(documentParentPath);
    }

    throw `This write batch wasn't registered`;
  }

  setDocument(documentPath: string, documentJSON: DocumentJSON, writeBatch: WriteBatch) {

    if (this._registeredWriteBatches.has(writeBatch)) {
      this._access.documents.set(documentPath, documentJSON);
      return;
    }

    throw `This write batch wasn't registered`;
  }

  deleteDocument(documentPath: string, writeBatch: WriteBatch) {

    if (this._registeredWriteBatches.has(writeBatch)) {
      this._access.documents.delete(documentPath);
      return;
    }

    throw `This write batch wasn't registered`;
  }

  registerWriteBatch(writeBatch: WriteBatch) {
    this._registeredWriteBatches.add(writeBatch);
  }

  unregisterWriteBatch(writeBatch: WriteBatch) {
    this._registeredWriteBatches.delete(writeBatch);
  }

  async getDocument(documentReference: DocumentReference) {
    const documentJSON = this._access.documents.get(documentReference.path);
    return IdbDatabase.getDocumentFromDocumentJSON(documentReference, documentJSON);
  }

  static async runWriteBatch(inMemory: InMemory, writeBatch: WriteBatch, writeBatchOperations: WriteBatchOperation[]) {

    inMemory.registerWriteBatch(writeBatch);

    for (const operation of writeBatchOperations) {
      operation.documentPromise = inMemory.getDocument(operation.documentReference);
    }

    const date = new Date();

    for (const operation of writeBatchOperations) {

      operation.document = await operation.documentPromise!;
      const document = operation.document;

      if (operation.type === WriteBatchOperationType.create) {

        if (document.exists) {
          throw new WriteBatchError(`WriteBatch detected that ${operation.documentReference.id} document exists but was to be created`);
        }

        document.createdAt = date;
        document.modifiedAt = date;
        document.data = operation.data!;
      }

      if (operation.type === WriteBatchOperationType.set) {
        document.modifiedAt = date;
        document.data = operation.data!;
      }

      if (operation.type === WriteBatchOperationType.update) {

        if (!document.exists) {
          throw new WriteBatchError(`WriteBatch detected that ${operation.documentReference.id} document doesn't exist but was to be updated`);
        }

        document.modifiedAt = date;
        document.data = mergeData(document.data, operation.data!);
      }

      if (operation.type === WriteBatchOperationType.delete) {

        if (!document.exists) {
          throw new WriteBatchError(`WriteBatch detected that ${operation.documentReference.id} doesn't exist but was to be deleted`);
        }
      }
    }

    for (const operation of writeBatchOperations) {

      const document = operation.document!;
      const documentPath = document.documentReference.path;
      const documentParentPath = document.documentReference.parentReference.path;
      const documentJSON = document.toJSON();

      let collection = inMemory.getCollection(documentParentPath, writeBatch);

      if (!collection) {
        inMemory.setCollection(documentParentPath, new Set<string>(), writeBatch);
        collection = inMemory.getCollection(documentParentPath, writeBatch);
      }

      if (operation.type === WriteBatchOperationType.create) {
        inMemory.setDocument(documentPath, documentJSON, writeBatch);
        collection!.add(document.documentReference.path);
      }

      if (operation.type === WriteBatchOperationType.set) {
        inMemory.setDocument(documentPath, documentJSON, writeBatch);
        collection!.add(document.documentReference.path);
      }

      if (operation.type === WriteBatchOperationType.update) {
        inMemory.setDocument(documentPath, documentJSON, writeBatch);
        collection!.add(document.documentReference.path);
      }

      if (operation.type === WriteBatchOperationType.delete) {
        inMemory.deleteDocument(documentPath, writeBatch);
        collection!.delete(document.documentReference.path);
      }

      inMemory.setCollection(documentParentPath, collection!, writeBatch);
    }

    // reload document

    for (const operation of writeBatchOperations) {
      operation.documentPromise = inMemory.getDocument(operation.documentReference);
    }

    for (const operation of writeBatchOperations) {
      operation.document = await operation.documentPromise!;
    }

    for (const operation of writeBatchOperations) {
      operation.document!.notifyObservers();
      inMemory.notifyRegisteredGetDocuments(operation.document!.documentReference.parentReference);
    }

    inMemory.unregisterWriteBatch(writeBatch);
    return true;
  }

  getDocuments(collectionReference: CollectionReference): Promise<Document[]>;
  getDocuments(collectionReference: CollectionReference, observer?: Observer<Document[], Error>): Unsubscribe;

  getDocuments(collectionReference: CollectionReference, observer?: Observer<Document[], Error>): Promise<Document[]> | Unsubscribe {

    const documentPaths = this._access.collections.get(collectionReference.path) || new Set<string>();

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

      const documents: Document[] = [];

      for (const documentPath of documentPaths) {
        documents.push(Document.getInstance(doc(this, documentPath)));
      }

      observer.next?.(documents);

      return unsubscribe;
    }

    const documents: Document[] = [];

    for (const documentPath of documentPaths) {
      documents.push(Document.getInstance(doc(this, documentPath)));
    }

    return Promise.resolve(documents);
  }

  async clear() {
    this._access.collections.clear();
    this._access.documents.clear();
  }
}

export function getInMemory(projectId: string, cb: (inMemory: InMemory) => void) {
  InMemory.getInstance(projectId, cb);
}
