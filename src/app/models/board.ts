import {
  doc,
  DocumentData,
  DocumentSnapshot,
  Firestore,
  FirestoreDataConverter
} from 'firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';

export interface BoardDoc extends DocumentData {
  readonly name: string;
  readonly boardStatusesIds: string[];
  readonly boardTasksIds: string[];
}

export class Board implements BoardDoc {

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly boardStatusesIds: string[],
    public readonly boardTasksIds: string[],
    public readonly exists: boolean
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: Board._snapToThis
  } as FirestoreDataConverter<Board, BoardDoc>;

  static firestoreRef(firestore: Firestore, id: string) {
    return doc(firestore, Collections.boards, id).withConverter(Board._converter);
  }

  static firestoreData(snap: DocumentSnapshot<Board, BoardDoc>) {
    return Board._snapToThis(snap);
  }

  private static _snapToThis(snap: DocumentSnapshot<Board, BoardDoc>) {

    const data = snap.data();

    let name = '';
    let boardStatusesIds: string[] = [];
    let boardTasksIds: string[] = [];

    data?.['name'] && typeof data['name'] === 'string' && data['name'].length > 0 && (name = data['name']);

    if (
      data?.['boardStatusesIds'] &&
      Array.isArray(data['boardStatusesIds']) &&
      !data['boardStatusesIds'].some((e) => typeof e !== 'string')
    ) {
      boardStatusesIds = data['boardStatusesIds'];
    }

    if (
      data?.['boardTasksIds'] &&
      Array.isArray(data['boardTasksIds']) &&
      !data['boardTasksIds'].some((e) => typeof e !== 'string')
    ) {
      boardTasksIds = data['boardTasksIds'];
    }

    return new Board(
      snap.id,
      name,
      boardStatusesIds,
      boardTasksIds,
      snap.exists()
    );
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
