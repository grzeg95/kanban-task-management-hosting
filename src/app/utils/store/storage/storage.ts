import {Observer, Unsubscribe} from '../data';
import {Document, DocumentJSON} from '../objects';
import {CollectionReference, DocumentReference} from '../references';
import {WriteBatch, WriteBatchOperation} from './write-batch';

export abstract class Storage {

  protected _registeredGetDocuments = new Map<CollectionReference, Map<Observer<Document[], Error>, Unsubscribe>>();

  protected constructor(
    public readonly projectId: string
  ) {
  }

  abstract getDocument(documentReference: DocumentReference): Promise<Document>;

  abstract getDocuments(collectionReference: CollectionReference): Promise<Document[]>;
  abstract getDocuments(collectionReference: CollectionReference, observer: Observer<Document[], Error>): Unsubscribe;

  async notifyRegisteredGetDocuments(collectionReference: CollectionReference) {

    const map = this._registeredGetDocuments.get(collectionReference);

    if (map) {

      try {
        const documentPaths: Document[] = await this.getDocuments(collectionReference);

        for (const [observer] of map) {
          observer.next?.(documentPaths);
        }
      } catch (e) {

        for (const [observer] of map) {
          observer.error?.(e as Error);
        }
      }
    }
  }

  static getDocumentFromDocumentJSON(documentReference: DocumentReference, documentJSON?: DocumentJSON) {

    if (!documentJSON) {
      documentJSON = {
        id: documentReference.id,
        storageType: documentReference.parentReference.storage.constructor.name,
        projectId: documentReference.parentReference.storage.projectId,
        data: {},
        parentPath: documentReference.parentReference.path,
        createdAt: null,
        modifiedAt: null,
        exists: false
      } as DocumentJSON;
    }

    const document = Document.getInstance(documentReference);

    document.data = documentJSON.data;
    document.createdAt = document.createdAt ? new Date(documentJSON.createdAt!) : null
    document.modifiedAt = document.modifiedAt ? new Date(documentJSON.modifiedAt!) : null
    document.got = true;
    return document;
  }

  abstract clear(): Promise<void>;
}

