import {doc, DocumentSnapshot, Firestore} from '@angular/fire/firestore';
import {FirestoreDataConverter} from '@firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';

export type BoardDoc = {
  name: string;
  boardStatusesIds: string[];
  boardTasksIds: string[];
};

export class Board implements BoardDoc {

  constructor(
    public id: string = '',
    public name: string = '',
    public boardStatusesIds: string[] = [],
    public boardTasksIds: string[] = [],
  ) {
  }

  private static _conventer = {
    toFirestore: (boardDoc: BoardDoc) => cloneDeep(boardDoc),
    fromFirestore: (snap) => {

      const data = cloneDeep(snap.data()) as BoardDoc;

      return new Board(
        snap.id,
        data.name,
        data.boardStatusesIds,
        data.boardTasksIds
      );
    }
  } as FirestoreDataConverter<Board, BoardDoc>;

  static ref(firestore: Firestore, id: string) {
    return doc(firestore, Collections.boards, id).withConverter(Board._conventer);
  }

  static data(boardSnap: DocumentSnapshot<Board, BoardDoc>) {
    return boardSnap.data() || new Board(boardSnap.id);
  }
}

export type BoardCreateData = {
  name: string;
  boardStatusesNames: string[];
};

export type BoardCreateResult = {
  id: string;
  boardsIds: string[];
  boardStatusesIds: string[];
};

export type BoardDeleteData = {
  id: string;
};

export type BoardDeleteResult = {
  boardsIds: string[];
};

export type BoardUpdateData = {
  id: string;
  name: string;
  boardStatuses: {
    id?: string;
    name: string;
  }[];
};

export type BoardUpdateResult = {
  boardStatusesIds: string[];
  boardTasksIds: string[];
};
