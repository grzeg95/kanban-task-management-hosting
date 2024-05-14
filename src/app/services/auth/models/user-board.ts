import {
  collection as firestoreCollection,
  DocumentReference,
  DocumentSnapshot as firestoreDocumentSnapshot,
  QueryDocumentSnapshot as firestoreQueryDocumentSnapshot,
  FirestoreDataConverter
} from '@angular/fire/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../../firebase/collections';
import {User, UserDoc} from './user';
import {DocumentReference as storeDocumentReference, DocumentSnapshot as storeDocumentSnapshot, collection as storeCollection} from '../../../utils/store';

export type UserBoardDoc = {
  name: string;
};

export class UserBoard {

  constructor(
    public id: string = '',
    public name: string = ''
  ) {
  }

  static valueOf(userBoard: UserBoard) {
    return cloneDeep({
      name: userBoard.name,
    }) as UserBoardDoc;
  }

  private static _conventer = {
    toFirestore: (userBoard: UserBoard) => UserBoard.valueOf(userBoard),
    fromFirestore: (snap) => {

      const data = cloneDeep(snap.data()) as UserBoard;

      return new UserBoard(
        snap.id,
        data.name
      );
    }
  } as FirestoreDataConverter<UserBoard, UserBoardDoc>;

  static firestoreCollectionRef(userRef: DocumentReference<User, UserDoc>) {
    return firestoreCollection(userRef, Collections.userBoards).withConverter(UserBoard._conventer);
  }

  static firestoreData(userBoardsSnap: firestoreDocumentSnapshot<UserBoard, UserBoardDoc>): UserBoard;
  static firestoreData(userBoardQuerySnap: firestoreQueryDocumentSnapshot<UserBoard, UserBoardDoc>): UserBoard;

  static firestoreData(userBoardsSnapOrUserBoardQuerySnap: firestoreDocumentSnapshot<UserBoard, UserBoardDoc> | firestoreQueryDocumentSnapshot<UserBoard, UserBoardDoc>) {
    return userBoardsSnapOrUserBoardQuerySnap.data() || new UserBoard(userBoardsSnapOrUserBoardQuerySnap.id);
  }

  static storeCollectionRef(userRef: storeDocumentReference) {
    return storeCollection(userRef, Collections.userBoards);
  }

  static storeRef(userBoardsRef: storeDocumentReference, userBoardId: string) {
    return userBoardsRef.collection(Collections.userBoards).doc(userBoardId);
  }

  static storeData(userBoardsDocumentSnapshot: storeDocumentSnapshot) {

    if (userBoardsDocumentSnapshot.exists) {
      return new UserBoard(
        userBoardsDocumentSnapshot.data['id'] as string,
        userBoardsDocumentSnapshot.data['name'] as string
      );
    }

    return new UserBoard(userBoardsDocumentSnapshot.id);
  }
}
