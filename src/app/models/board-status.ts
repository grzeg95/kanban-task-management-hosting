import {collection as firestoreCollection, DocumentReference as firestoreDocumentReference, DocumentSnapshot as firestoreDocumentSnapshot} from '@angular/fire/firestore';
import {collection as storeCollection, DocumentReference as storeDocumentReference, DocumentSnapshot as storeDocumentSnapshot} from '@npm/store';
import {FirestoreDataConverter} from '@firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {Board, BoardDoc} from './board';

export type BoardStatusDoc = {
  name: string;
  boardTasksIds: string[]
};

export class BoardStatus implements BoardStatusDoc {

  constructor(
    public id: string = '',
    public name: string = '',
    public boardTasksIds: string[] = []
  ) {
  }

  private static _conventer = {
    toFirestore: (boardStatusDoc: BoardStatusDoc) => cloneDeep(boardStatusDoc),
    fromFirestore: (snap) => {

      const data = cloneDeep(snap.data()) as BoardStatusDoc;

      return new BoardStatus(
        snap.id,
        data.name,
        data.boardTasksIds
      );
    }
  } as FirestoreDataConverter<BoardStatus, BoardStatusDoc>;

  static firestoreRef(boardRef: firestoreDocumentReference<Board>) {
    return boardRef.withConverter(BoardStatus._conventer);
  }

  static firestoreCollectionRef(boardRef: firestoreDocumentReference<Board, BoardDoc>) {
    return firestoreCollection(boardRef, Collections.boardStatuses).withConverter(BoardStatus._conventer);
  }

  static firestoreData(boardStatusSnap: firestoreDocumentSnapshot<BoardStatus, BoardStatusDoc>) {
    return boardStatusSnap.data() || new BoardStatus();
  }

  static storeRef(boardRef: storeDocumentReference) {
    return boardRef;
  }

  static storeCollectionRefs(boardRef: storeDocumentReference, board: Board) {

    const boardStatusesCollectionRef = boardRef.collection(Collections.boardStatuses);
    const boardStatusesRefs = [];

    for (const boardStatusId of board.boardStatusesIds) {
      boardStatusesRefs.push(boardStatusesCollectionRef.doc(boardStatusId));
    }

    return boardStatusesRefs;
  }

  static storeData(boardStatusSnap: storeDocumentSnapshot) {

    if (boardStatusSnap.exists) {
      return new BoardStatus(
        boardStatusSnap.data['id'] as string,
        boardStatusSnap.data['name'] as string,
        boardStatusSnap.data['boardTasksIds'] as string[]
      );
    }

    return new BoardStatus(boardStatusSnap.id);
  }
}
