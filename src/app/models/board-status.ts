import {
  collection as firestoreCollection,
  doc as firestoreDoc,
  DocumentData,
  DocumentReference as firestoreDocumentReference,
  DocumentSnapshot as firestoreDocumentSnapshot,
  FirestoreDataConverter
} from '@angular/fire/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {
  collection as storeCollection,
  DocumentReference as storeDocumentReference,
  DocumentSnapshot as storeDocumentSnapshot
} from '../utils/store';
import {Board, BoardDoc} from './board';

export type BoardStatusDoc = {
  name: string;
  boardTasksIds: string[]
};

export class BoardStatus implements BoardStatusDoc {

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly boardTasksIds: string[]
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: BoardStatus._snapToThis
  } as FirestoreDataConverter<BoardStatus, BoardStatusDoc>;

  static firestoreRef(ref: firestoreDocumentReference<Board>, statusId: string) {
    return firestoreDoc(ref, Collections.boardStatuses, statusId).withConverter(BoardStatus._converter);
  }

  static firestoreCollectionRef(ref: firestoreDocumentReference<Board, BoardDoc>) {
    return firestoreCollection(ref, Collections.boardStatuses).withConverter(BoardStatus._converter);
  }

  static firestoreData(snap: firestoreDocumentSnapshot<BoardStatus, BoardStatusDoc>) {
    return BoardStatus._snapToThis(snap);
  }

  static storeRef(ref: storeDocumentReference, statusId?: string) {
    return ref.collection(Collections.boardStatuses).doc(statusId);
  }

  static storeCollectionRefs(ref: storeDocumentReference, board: Board) {

    const boardStatusesCollectionRef = ref.collection(Collections.boardStatuses);
    const boardStatusesRefs = [];

    for (const boardStatusId of board.boardStatusesIds) {
      boardStatusesRefs.push(boardStatusesCollectionRef.doc(boardStatusId));
    }

    return boardStatusesRefs;
  }

  static storeCollectionRef(ref: storeDocumentReference) {
    return storeCollection(ref, Collections.boardStatuses);
  }

  static storeData(snap: storeDocumentSnapshot) {
    return BoardStatus._snapToThis(snap);
  }

  private static _snapToThis(snap: firestoreDocumentSnapshot<BoardStatus | DocumentData, BoardStatusDoc> | storeDocumentSnapshot) {

    let data: any;

    if (snap instanceof firestoreDocumentSnapshot) {
      data = snap.data();
    } else {
      data = snap.data;
    }

    let name = '';
    let boardTasksIds: string[] = [];

    data?.['name'] && typeof data['name'] === 'string' && data['name'].length > 0 && (name = data['name']);

    if (
      data?.['boardTasksIds'] &&
      Array.isArray(data['boardTasksIds']) &&
      !data['boardTasksIds'].some((e) => typeof e !== 'string')
    ) {
      boardTasksIds = data['boardTasksIds'];
    }

    return new BoardStatus(
      snap.id,
      name,
      boardTasksIds
    );
  }
}
