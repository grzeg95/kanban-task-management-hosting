import {
  collection as firestoreCollection,
  DocumentData,
  DocumentReference,
  DocumentSnapshot as firestoreDocumentSnapshot,
  FirestoreDataConverter,
  QueryDocumentSnapshot as firestoreQueryDocumentSnapshot
} from 'firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {
  collection as storeCollection,
  DocumentReference as storeDocumentReference,
  DocumentSnapshot as storeDocumentSnapshot
} from '../utils/store';
import {User} from './user';

export interface UserBoardDoc extends DocumentData {
  name: string
}

export class UserBoard implements UserBoardDoc {

  constructor(
    public readonly id: string,
    public readonly name: string
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: UserBoard._snapToThis
  } as FirestoreDataConverter<UserBoard, UserBoardDoc>;

  static firestoreCollectionRef(ref: DocumentReference<User>) {
    return firestoreCollection(ref, Collections.userBoards).withConverter(UserBoard._converter);
  }

  static firestoreData(snap: firestoreDocumentSnapshot<UserBoard, UserBoardDoc>): UserBoard;
  static firestoreData(snap: firestoreQueryDocumentSnapshot<UserBoard, UserBoardDoc>): UserBoard;

  static firestoreData(snap: firestoreDocumentSnapshot<UserBoard, UserBoardDoc> | firestoreQueryDocumentSnapshot<UserBoard, UserBoardDoc>) {
    return UserBoard._snapToThis(snap);
  }

  static storeCollectionRef(ref: storeDocumentReference) {
    return storeCollection(ref, Collections.userBoards);
  }

  static storeRef(ref: storeDocumentReference, userBoardId: string) {
    return ref.collection(Collections.userBoards).doc(userBoardId);
  }

  static storeData(snap: storeDocumentSnapshot) {
    return UserBoard._snapToThis(snap);
  }

  private static _snapToThis(snap: firestoreDocumentSnapshot<UserBoard, UserBoardDoc> | storeDocumentSnapshot) {

    let data: any;

    if (snap instanceof firestoreDocumentSnapshot) {
      data = snap.data();
    } else {
      data = snap.data;
    }

    let name = '';

    data?.['name'] && typeof data['name'] === 'string' && data['name'].length > 0 && (name = data['name']);

    return new UserBoard(
      snap.id,
      name
    );
  }
}
