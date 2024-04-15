import {id} from '../id';
import {DocumentRef, FieldValue} from './store';

export class WriteBatchRespond {

  constructor(
    public id: string,
    public message: string
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
    return new Promise((resolve) => {

      // indexes also
      // get all documents
      // if something go wrong rollback

      for (const operation of this._operations) {

        if (operation.type === 'create') {

        }

        if (operation.type === 'set') {

        }

        if (operation.type === 'update') {

        }

        if (operation.type === 'delete') {

        }
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
