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
import {Board} from './board';

export interface BoardTaskDoc extends DocumentData {
  readonly title: string;
  readonly description: string;
  readonly boardTaskSubtasksIds: string[];
  readonly boardStatusId: string;
  readonly completedBoardTaskSubtasks: number;
}

export class BoardTask implements BoardTaskDoc {

  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly boardTaskSubtasksIds: string[],
    public readonly boardStatusId: string,
    public readonly completedBoardTaskSubtasks: number
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: BoardTask._snapToThis
  } as FirestoreDataConverter<BoardTask, BoardTaskDoc>;

  static firestoreRef(ref: firestoreDocumentReference<Board>, id: string) {
    return firestoreDoc(ref, Collections.boardTasks, id).withConverter(BoardTask._converter);
  }

  static firestoreCollectionRef(ref: firestoreDocumentReference<Board>) {
    return firestoreCollection(ref, Collections.boardTasks).withConverter(BoardTask._converter);
  }

  static firestoreData(snap: firestoreDocumentSnapshot<BoardTask>) {
    return BoardTask._snapToThis(snap);
  }

  private static _snapToThis(snap: firestoreDocumentSnapshot<BoardTask>) {

    const data = snap.data();

    let title = '';
    let description = '';
    let boardTaskSubtasksIds: string[] = [];
    let boardStatusId = '';
    let completedBoardTaskSubtasks = 0;

    data?.['title'] && typeof data['title'] === 'string' && data['title'].length > 0 && (title = data['title']);
    data?.['description'] && typeof data['description'] === 'string' && data['description'].length > 0 && (description = data['description']);

    if (
      data?.['boardTaskSubtasksIds'] &&
      Array.isArray(data['boardTaskSubtasksIds']) &&
      !data['boardTaskSubtasksIds'].some((e) => typeof e !== 'string')
    ) {
      boardTaskSubtasksIds = data['boardTaskSubtasksIds'];
    }

    data?.['boardStatusId'] && typeof data['boardStatusId'] === 'string' && data['boardStatusId'].length > 0 && (boardStatusId = data['boardStatusId']);
    data?.['completedBoardTaskSubtasks'] && typeof data['completedBoardTaskSubtasks'] === 'number' && data['completedBoardTaskSubtasks'] > 0 && (completedBoardTaskSubtasks = data['completedBoardTaskSubtasks']);

    return new BoardTask(
      snap.id,
      title,
      description,
      boardTaskSubtasksIds,
      boardStatusId,
      completedBoardTaskSubtasks
    );
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
