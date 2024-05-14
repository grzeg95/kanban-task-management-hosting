import {
  collection as firestoreCollection,
  doc as firestoreDoc,
  DocumentReference as firestoreDocumentReference,
  DocumentSnapshot as firestoreDocumentSnapshot,
  FirestoreDataConverter
} from '@angular/fire/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {DocumentReference as storeDocumentReference, DocumentSnapshot as storeDocumentSnapshot} from '../utils/store';
import {Board, BoardDoc} from './board';
import {BoardStatus} from './board-status';

export type BoardTaskDoc = {
  title: string;
  description: string;
  boardTaskSubtasksIds: string[];
  boardStatusId: string;
  completedBoardTaskSubtasks: number;
}

export class BoardTask implements BoardTaskDoc {

  constructor(
    public id: string = '',
    public title: string = '',
    public description: string = '',
    public boardTaskSubtasksIds: string[] = [],
    public boardStatusId: string = '',
    public completedBoardTaskSubtasks: number = 0
  ) {
  }

  private static _conventer = {
    toFirestore: (boardTaskDoc: BoardTaskDoc) => cloneDeep(boardTaskDoc),
    fromFirestore: (snap) => {

      const data = cloneDeep(snap.data()) as BoardTaskDoc;

      return new BoardTask(
        snap.id,
        data.title,
        data.description,
        data.boardTaskSubtasksIds,
        data.boardStatusId,
        data.completedBoardTaskSubtasks
      );
    }
  } as FirestoreDataConverter<BoardTask, BoardTaskDoc>;

  static firestoreRef(boardRef: firestoreDocumentReference<Board, BoardDoc>, id: string) {
    return firestoreDoc(boardRef, Collections.boardTasks, id).withConverter(BoardTask._conventer);
  }

  static firestoreCollectionRef(boardRef: firestoreDocumentReference<Board, BoardDoc>) {
    return firestoreCollection(boardRef, Collections.boardTasks).withConverter(BoardTask._conventer);
  }

  static firestoreData(boardTaskSnap: firestoreDocumentSnapshot<BoardTask, BoardTaskDoc>) {
    return boardTaskSnap.data() || new BoardTask();
  }

  static storeRef(boardRef: storeDocumentReference, id?: string) {
    return boardRef.collection(Collections.boardTasks).doc(id);
  }

  static storeRefs(boardRef: storeDocumentReference, boardStatus: BoardStatus) {

    const boardStatusesCollectionRef = boardRef.collection(Collections.boardStatuses);
    const boardStatusesRefs = [];

    for (const boardStatusId of boardStatus.boardTasksIds) {
      boardStatusesRefs.push(boardStatusesCollectionRef.doc(boardStatusId));
    }

    return boardStatusesRefs;
  }

  static storeCollectionRef(boardRef: storeDocumentReference) {
    return boardRef.collection(Collections.boardTasks);
  }

  static storeData(boardTaskSnap: storeDocumentSnapshot) {

    if (boardTaskSnap.exists) {
      return new BoardTask(
        boardTaskSnap.id,
        boardTaskSnap.data['title'] as string,
        boardTaskSnap.data['description'] as string,
        boardTaskSnap.data['boardTaskSubtasksIds'] as string[],
        boardTaskSnap.data['boardStatusId'] as string,
        boardTaskSnap.data['completedBoardTaskSubtasks'] as number
      );
    }

    return new BoardTask(boardTaskSnap.id);
  }
}

export type BoardTaskCreateData = {
  boardId: string;
  boardStatusId: string;
  title: string;
  description: string;
  boardTaskSubtasksTitles: string[];
};

export type BoardTaskCreateResult = {
  id: string;
  boardTasksIds: string[];
  boardStatusBoardTasksIds: string[];
  boardTaskSubtasksIds: string[];
};

export type BoardTaskDeleteData = {
  id: string;
  boardId: string;
};

export type BoardTaskDeleteResult = undefined;

export type BoardTaskUpdateData = {
  id: string;
  boardId: string;
  boardStatus: {
    id: string,
    newId?: string
  },
  title: string;
  description: string;
  boardTaskSubtasks: {
    id?: string;
    title: string;
  }[];
};

export type BoardTaskUpdateResult = {
  boardTaskSubtasksIds: string[];
};
