import {doc, DocumentSnapshot, Firestore} from '@angular/fire/firestore';
import {FirestoreDataConverter} from '@firebase/firestore';
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

  static ref(firestore: Firestore, id: string) {
    return doc(firestore, Collections.users, id).withConverter(User._conventer);
  }

  static data(userSnap: DocumentSnapshot<User, UserDoc>) {
    return userSnap.data() || new User(userSnap.id);
  }
}
