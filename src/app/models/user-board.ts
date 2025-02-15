import {
  collection,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FirestoreDataConverter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {User, UserDoc} from './user';

export interface UserBoardDoc extends DocumentData {
  readonly name: string
}

export class UserBoard implements UserBoardDoc {

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly exists: boolean
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: UserBoard._snapToThis
  } as FirestoreDataConverter<UserBoard, UserBoardDoc>;

  static firestoreCollectionRef(ref: DocumentReference<User, UserDoc>) {
    return collection(ref, Collections.userBoards).withConverter(UserBoard._converter);
  }

  static firestoreData(snap: DocumentSnapshot<UserBoard, UserBoardDoc>): UserBoard;
  static firestoreData(snap: QueryDocumentSnapshot<UserBoard, UserBoardDoc>): UserBoard;

  static firestoreData(snap: DocumentSnapshot<UserBoard, UserBoardDoc> | QueryDocumentSnapshot<UserBoard, UserBoardDoc>) {
    return UserBoard._snapToThis(snap);
  }

  private static _snapToThis(snap: DocumentSnapshot<UserBoard, UserBoardDoc>) {

    const data = snap.data();

    let name = '';

    data?.['name'] && typeof data['name'] === 'string' && data['name'].length > 0 && (name = data['name']);

    return new UserBoard(
      snap.id,
      name,
      snap.exists()
    );
  }
}
