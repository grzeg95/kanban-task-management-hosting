import {
  collection as firestoreCollection,
  doc as firestoreDoc,
  DocumentData,
  DocumentReference as firestoreDocumentReference,
  DocumentSnapshot as firestoreDocumentSnapshot,
  FirestoreDataConverter
} from 'firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {DocumentReference as storeDocumentReference, DocumentSnapshot as storeDocumentSnapshot} from '../utils/store';
import {Board} from './board';
import {BoardStatus} from './board-status';

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

  static firestoreData(snap: firestoreDocumentSnapshot<BoardTask, BoardTaskDoc>) {
    return BoardTask._snapToThis(snap);
  }

  static storeRef(ref: storeDocumentReference, id?: string) {
    return ref.collection(Collections.boardTasks).doc(id);
  }

  static storeRefs(ref: storeDocumentReference, boardStatus: BoardStatus) {

    const boardStatusesCollectionRef = ref.collection(Collections.boardStatuses);
    const boardStatusesRefs = [];

    for (const boardStatusId of boardStatus.boardTasksIds) {
      boardStatusesRefs.push(boardStatusesCollectionRef.doc(boardStatusId));
    }

    return boardStatusesRefs;
  }

  static storeCollectionRef(ref: storeDocumentReference) {
    return ref.collection(Collections.boardTasks);
  }

  static storeData(snap: storeDocumentSnapshot) {
    return BoardTask._snapToThis(snap);
  }

  private static _snapToThis(snap: firestoreDocumentSnapshot<BoardTask, BoardTaskDoc> | storeDocumentSnapshot) {

    let data: any;

    if (snap instanceof firestoreDocumentSnapshot) {
      data = snap.data();
    } else {
      data = snap.data;
    }

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
