import {
  doc as firestoreDoc,
  DocumentData,
  DocumentSnapshot as firestoreDocumentSnapshot,
  Firestore,
  FirestoreDataConverter
} from '@angular/fire/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {doc as storeDoc, DocumentSnapshot as storeDocumentSnapshot, IdbDatabase, InMemory} from '../utils/store';

export type UserDoc = {
  disabled: boolean;
  boardsIds: string[];
  darkMode: boolean | null;
};

export class User {

  constructor(
    public id: string,
    public disabled: boolean,
    public boardsIds: string[],
    public darkMode: boolean | null
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

  static storeRef(storage: InMemory | IdbDatabase, id: string) {
    return storeDoc(storage, [Collections.users, id].join('/'));
  }

  static storeData(snap: storeDocumentSnapshot) {
    return User._snapToThis(snap);
  }

  private static _snapToThis(snap: firestoreDocumentSnapshot<User | DocumentData, UserDoc> | storeDocumentSnapshot) {

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
