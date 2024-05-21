import {Observer, Unsubscribe} from '../data';
import {Document, DocumentFields, DocumentJSON} from '../objects';
import {CollectionReference, DocumentReference} from '../references';

export enum StoreNames {
  documents = 'p'
}

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
        [DocumentFields.id]: documentReference.id,
        [DocumentFields.data]: {},
        [DocumentFields.parentPath]: documentReference.parentReference.path,
        [DocumentFields.createdAt]: null,
        [DocumentFields.modifiedAt]: null
      } as DocumentJSON;
    }

    const document = Document.getInstance(documentReference);

    document.data = documentJSON[DocumentFields.data];
    document.createdAt = documentJSON[DocumentFields.createdAt] ? new Date(documentJSON[DocumentFields.createdAt]!) : null
    document.modifiedAt = documentJSON[DocumentFields.modifiedAt] ? new Date(documentJSON[DocumentFields.modifiedAt]!) : null
    document.got = true;

    return document;
  }

  abstract clear(): Promise<void>;
}

