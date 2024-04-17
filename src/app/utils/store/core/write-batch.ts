import merge from 'lodash/merge';
import {id} from '../../id';
import {Document, DocumentReference} from '../document';
import {FieldValue} from './data';
import {IdbDatabase} from './idb-database';

export class WriteBatchRespond {

  constructor(
    public id: string,
    public message: string
  ) {
  }
}

export class WriteBatchError extends Error {

  constructor(
    public id: string,
    message: string
  ) {
    super(message);
  }
}

export class WriteBatch {

  private static _ids = new Set<string>();
  private _id = id(WriteBatch._ids);

  get id() {
    return this._id;
  }

  private _result = '';
  private _operations: {
    type: 'create' | 'set' | 'update' | 'delete',
    documentReference: DocumentReference,
    data?: FieldValue,
    documentPromise?: Promise<Document>
  }[] = [];

  constructor(
    public projectId: string,
    public auth: string
  ) {
  }

  async commit() {

    const db = await IdbDatabase.getInstance(this.projectId);
    const transaction = db.transaction('documents', 'readwrite');
    const documentsStore = transaction.objectStore('documents');

    for (const operation of this._operations) {
      operation.documentPromise = Document.get(operation.documentReference, documentsStore);
    }

    const date = new Date();

    for (const operation of this._operations) {

      const document = await operation.documentPromise!;

      if (operation.type === 'create') {

        if (document.exists) {
          transaction.abort();
          throw new WriteBatchError(this._id, `WriteBatch detected that ${document.id} document exists but was to be created`);
        }

        document.createdAt = date;
        document.modifiedAt = date;
        documentsStore.add(document.toJSON());
      }

      if (operation.type === 'set') {

        document.createdAt = date;
        document.modifiedAt = date;
        document.data = operation.data!;

        if (document.exists) {
          documentsStore.put(document.toJSON());
        } else {
          documentsStore.add(document.toJSON());
        }
      }

      if (operation.type === 'update') {

        if (!document.exists) {
          transaction.abort();
          throw new WriteBatchError(this._id, `WriteBatch detected that ${document.id} document doesn't exist but was to be updated`);
        }

        document.createdAt = date;
        document.modifiedAt = date;
        document.data = merge({}, document.data, operation.data);

        documentsStore.put(document.toJSON());
      }

      if (operation.type === 'delete') {

        if (document.exists) {
          transaction.abort();
          throw new WriteBatchError(this._id, `WriteBatch detected that ${document.id} doesn't exist but was to be deleted`);
        }

        documentsStore.delete([document.id, document.parentPath]);
      }
    }

    transaction.commit();

    for (const operation_2 of this._operations) {
      const document_1 = await operation_2.documentPromise!;
      document_1.notifyObservers();
    }

    return new WriteBatchRespond(this.id, 'WriteBatch stored your batch');
  }

  create(documentReference: DocumentReference, data: FieldValue) {
    this._operations.push({
      type: 'create',
      documentReference: documentReference,
      data
    });
  }

  set(documentReference: DocumentReference, data: FieldValue) {
    this._operations.push({
      type: 'set',
      documentReference: documentReference,
      data
    });
  }

  update(documentReference: DocumentReference, data: FieldValue) {
    this._operations.push({
      type: 'update',
      documentReference: documentReference,
      data
    });
  }

  delete(documentReference: DocumentReference) {
    this._operations.push({
      type: 'delete',
      documentReference: documentReference
    });
  }
}
