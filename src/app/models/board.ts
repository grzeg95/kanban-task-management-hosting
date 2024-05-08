import {doc as firestoreDoc, DocumentSnapshot as firestoreDocumentSnapshot, Firestore} from '@angular/fire/firestore';
import {doc as storeDoc, DocumentSnapshot as storeDocumentSnapshot, Storage} from '@npm/store';
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

  static firestoreRef(firestore: Firestore, id: string) {
    return firestoreDoc(firestore, Collections.boards, id).withConverter(Board._conventer);
  }

  static firestoreData(boardSnap: firestoreDocumentSnapshot<Board, BoardDoc>) {
    return boardSnap.data() || new Board(boardSnap.id);
  }

  static storeRef(storage: Storage, id?: string) {
    return storeDoc(storage, [Collections.boards, id].filter(p => !!p).join('/'));
  }

  static storeData(boardSnap: storeDocumentSnapshot) {

    if (boardSnap.exists) {
      return new Board(
        boardSnap.data['id'] as string,
        boardSnap.data['name'] as string,
        boardSnap.data['boardStatusesIds'] as string[],
        boardSnap.data['boardTasksIds'] as string[]
      );
    }

    return new Board(boardSnap.id);
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
