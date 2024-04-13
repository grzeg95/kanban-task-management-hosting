import {collection, doc, DocumentReference, DocumentSnapshot} from '@angular/fire/firestore';
import {FirestoreDataConverter} from '@firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {User, UserDoc} from '../services/auth/models/user';
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

  static ref(boardRef: DocumentReference<Board>, id: string) {
    return doc(boardRef, id).withConverter(BoardStatus._conventer);
  }

  static collectionRef(boardRef: DocumentReference<Board, BoardDoc>) {
    return collection(boardRef, Collections.boardStatuses).withConverter(BoardStatus._conventer);
  }

  static data(boardStatusSnap: DocumentSnapshot<BoardStatus, BoardStatusDoc>) {
    return boardStatusSnap.data() || new BoardStatus();
  }
}
