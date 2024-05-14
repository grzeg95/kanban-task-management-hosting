import {FirestoreDataConverter, doc as firestoreDoc, DocumentSnapshot as firestoreDocumentSnapshot, Firestore} from '@angular/fire/firestore';
import {
  Data,
  doc as storeDoc,
  DocumentSnapshot as storeDocumentSnapshot,
  IdbDatabase,
  InMemory,
  Storage
} from '../../../utils/store';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../../firebase/collections';

export type UserDoc = {
  disabled: boolean;
  boardsIds: string[];
  darkMode: boolean | null;
};

export class User {

  constructor(
    public id: string = '',
    public disabled: boolean = false,
    public boardsIds: string[] = [],
    public darkMode: boolean | null = null
  ) {
  }

  private static _conventer = {
    toFirestore: (userDoc: UserDoc) => cloneDeep(userDoc),
    fromFirestore: (snap) => {

      const data = cloneDeep(snap.data()) as UserDoc;

      return new User(
        snap.id,
        data.disabled,
        data.boardsIds,
        data.darkMode
      );
    }
  } as FirestoreDataConverter<User, UserDoc>;

  static firestoreRef(firestore: Firestore, id: string) {
    return firestoreDoc(firestore, Collections.users, id).withConverter(User._conventer);
  }

  static firestoreData(userSnap: firestoreDocumentSnapshot<User, UserDoc>) {
    return userSnap.data() || new User(userSnap.id);
  }

  static storeRef(storage: InMemory | IdbDatabase, id: string) {
    return storeDoc(storage, [Collections.users, id].join('/'));
  }

  static storeData(userSnap: storeDocumentSnapshot) {

    if (userSnap.exists) {
      return new User(
        userSnap.id,
        userSnap.data['disabled'] as boolean,
        userSnap.data['boardsIds'] as string[],
        userSnap.data['darkMode'] as boolean,
      );
    }

    return new User(userSnap.id);
  }
}
