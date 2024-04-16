import {id} from '../id';
import {DocumentRef, DocumentSnapshot, FieldValue, Document} from './store';
import merge from 'lodash/merge';

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

export class DocumentChanges {

  constructor(
    public readonly before: DocumentSnapshot,
    public readonly after: DocumentSnapshot,
    public readonly changes: {}
  ) {
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
    documentReference: DocumentRef,
    data?: FieldValue
  }[] = [];

  constructor(
    public projectId: string,
    public auth: string
  ) {
  }

  commit(): Promise<WriteBatchRespond> {
    return new Promise((resolve, reject) => {

      // indexes also
      // get all documents
      // if something go wrong rollback

      const changes = [];

      for (const operation of this._operations) {

        const documentSnapshot = operation.documentReference.get();

        if (operation.type === 'create') {
          if (documentSnapshot.exists) {
            reject(new WriteBatchError(this._id, `WriteBatch detected that ${documentSnapshot.id} document exists but was to be created`));
          }
        }

        if (operation.type === 'set') { /* empty */ }

        if (operation.type === 'update') {
          if (documentSnapshot.exists) {
            reject(new WriteBatchError(this._id, `WriteBatch detected that ${documentSnapshot.id} document doesn't exist but was to be updated`));
          }
        }

        if (operation.type === 'delete') {
          if (documentSnapshot.exists) {
            reject(new WriteBatchError(this._id, `WriteBatch detected that ${documentSnapshot.id} doesn't exist but was to be deleted`));
          }
        }

        changes.push({
          documentSnapshot,
          data: operation.data,
          type: operation.type
        });
      }

      const date = new Date();

      const documentsChanges = [];

      for (const change of changes) {

        if (change.type === 'create') {
          const document = new Document(
            change.documentSnapshot.projectId,
            change.data!,
            change.documentSnapshot.parentRef.path,
            '',
            date,
            null,
            change.documentSnapshot.id
          );

          documentsChanges.push({document, type: change.type});
        }

        if (change.type === 'set') {
          const document = new Document(
            change.documentSnapshot.projectId,
            change.data!,
            change.documentSnapshot.parentRef.path,
            '',
            date,
            null,
            change.documentSnapshot.id
          );

          documentsChanges.push({document, type: change.type});
        }

        if (change.type === 'update') {
          const document = new Document(
            change.documentSnapshot.projectId,
            merge({}, change.documentSnapshot.data, change.data),
            change.documentSnapshot.parentRef.path,
            '',
            date,
            null,
            change.documentSnapshot.id
          );

          documentsChanges.push({document, type: change.type});
        }

        if (change.type === 'delete') {
          const document = new Document(
            change.documentSnapshot.projectId,
            merge({}, change.documentSnapshot.data, change.data),
            change.documentSnapshot.parentRef.path,
            '',
            date,
            null,
            change.documentSnapshot.id
          );

          documentsChanges.push({document, type: change.type});
        }
      }

      for (const documentChange of documentsChanges) {

        if (documentChange.type === 'delete') {
          documentChange.document.delete();
        } else {
          documentChange.document.store();
        }

        documentChange. document.notifyObservers();
      }

      resolve(new WriteBatchRespond(this._id, 'WriteBatch has been done'));
    });
  }

  create(documentReference: DocumentRef, data: FieldValue) {
    this._operations.push({
      type: 'create',
      documentReference: documentReference,
      data
    });
  }

  set(documentReference: DocumentRef, data: FieldValue) {
    this._operations.push({
      type: 'set',
      documentReference: documentReference,
      data
    });
  }

  update(documentReference: DocumentRef, data: FieldValue) {
    this._operations.push({
      type: 'update',
      documentReference: documentReference,
      data
    });
  }

  delete(documentReference: DocumentRef) {
    this._operations.push({
      type: 'delete',
      documentReference: documentReference
    });
  }
}
