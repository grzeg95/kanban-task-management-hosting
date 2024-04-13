import {collection, doc, DocumentReference, DocumentSnapshot} from '@angular/fire/firestore';
import {FirestoreDataConverter} from '@firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {Board, BoardDoc} from './board';

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

  static ref(boardRef: DocumentReference<Board, BoardDoc>, id: string) {
    return doc(boardRef, id).withConverter(BoardTask._conventer);
  }

  static collectionRef(boardRef: DocumentReference<Board, BoardDoc>) {
    return collection(boardRef, Collections.boardTasks).withConverter(BoardTask._conventer);
  }

  static data(boardTaskSnap: DocumentSnapshot<BoardTask, BoardTaskDoc>) {
    return boardTaskSnap.data() || new BoardTask();
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
