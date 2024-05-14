import {Data} from '../data';
import {DocumentReference} from '../references';
import {Storage} from '../storage';
import {doc} from './doc';

export class DocumentSnapshotError extends Error {
}

export class DocumentSnapshot {

  public readonly reference: DocumentReference;
  public readonly exists: boolean;

  constructor(
    storage: Storage,
    public readonly data: Data,
    public readonly id: string,
    parentPath: string,
    public readonly createdAt: Date | null,
    public readonly modifiedAt: Date | null
  ) {
    const path = [...parentPath.split('/').slice(2), this.id].join('/');
    this.reference = doc(storage, path);
    this.exists = createdAt !== null;
  }
}
