import {
  collection,
  doc, DocumentData,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  QueryDocumentSnapshot
} from '@angular/fire/firestore';
import {FirestoreDataConverter} from '@firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../../firebase/collections';
import {User, UserDoc} from './user';

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

  static collectionRef(userRef: DocumentReference<User, UserDoc>) {
    return collection(userRef, Collections.userBoards).withConverter(UserBoard._conventer);
  }

  static data(userBoardsSnap: DocumentSnapshot<UserBoard, UserBoardDoc>): UserBoard;
  static data(userBoardQuerySnap: QueryDocumentSnapshot<UserBoard, UserBoardDoc>): UserBoard;

  static data(userBoardsSnapOrUserBoardQuerySnap: DocumentSnapshot<UserBoard, UserBoardDoc> | QueryDocumentSnapshot<UserBoard, UserBoardDoc>) {
    return userBoardsSnapOrUserBoardQuerySnap.data() || new UserBoard(userBoardsSnapOrUserBoardQuerySnap.id);
  }
}
