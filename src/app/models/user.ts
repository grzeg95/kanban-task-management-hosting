import {
  doc as firestoreDoc,
  DocumentData,
  DocumentSnapshot as firestoreDocumentSnapshot,
  Firestore,
  FirestoreDataConverter
} from 'firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {doc as storeDoc, DocumentSnapshot as storeDocumentSnapshot, Storage} from '../utils/store';

export interface UserDoc extends DocumentData {
  readonly disabled: boolean,
  readonly boardsIds: string[],
  readonly darkMode: boolean | null
}

export class User implements UserDoc {

  constructor(
    public readonly id: string,
    public readonly disabled: boolean,
    public readonly boardsIds: string[],
    public readonly darkMode: boolean | null
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: User._snapToThis
  } as FirestoreDataConverter<User, UserDoc>;

  static firestoreRef(firestore: Firestore, id: string) {
    return firestoreDoc(firestore, Collections.users, id).withConverter(User._converter);
  }

  static firestoreData(snap: firestoreDocumentSnapshot<User, UserDoc>) {
    return User._snapToThis(snap);
  }

  static storeRef(storage: Storage, id: string) {
    return storeDoc(storage, [Collections.users, id].join('/'));
  }

  static storeData(snap: storeDocumentSnapshot) {
    return User._snapToThis(snap);
  }

  private static _snapToThis(snap: firestoreDocumentSnapshot<User, UserDoc> | storeDocumentSnapshot) {

    let data: any;

    if (snap instanceof firestoreDocumentSnapshot) {
      data = snap.data();
    } else {
      data = snap.data;
    }

    let disabled = false;
    let boardsIds: string[] = [];
    let darkMode = null;

    data?.['disabled'] && typeof data['disabled'] === 'boolean' && (disabled = data['disabled']);

    if (
      data?.['boardsIds'] &&
      Array.isArray(data['boardsIds']) &&
      !data['boardsIds'].some((e) => typeof e !== 'string')
    ) {
      boardsIds = data['boardsIds'];
    }

    data?.['darkMode'] && (typeof data['darkMode'] === 'boolean' || data['darkMode'] === null) && (darkMode = data['darkMode']);

    return new User(
      snap.id,
      disabled,
      boardsIds,
      darkMode
    );
  }
}
