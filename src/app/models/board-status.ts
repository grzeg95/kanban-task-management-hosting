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
import {Board, BoardDoc} from './board';

export interface BoardStatusDoc extends DocumentData {
  readonly name: string;
  readonly boardTasksIds: string[];
}

export class BoardStatus implements BoardStatusDoc {

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly boardTasksIds: string[],
    public readonly exists: boolean
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: BoardStatus._snapToThis
  } as FirestoreDataConverter<BoardStatus, BoardStatusDoc>;

  static firestoreRef(ref: firestoreDocumentReference<Board, BoardDoc>, statusId: string) {
    return firestoreDoc(ref, Collections.boardStatuses, statusId).withConverter(BoardStatus._converter);
  }

  static firestoreCollectionRef(ref: firestoreDocumentReference<Board, BoardDoc>) {
    return firestoreCollection(ref, Collections.boardStatuses).withConverter(BoardStatus._converter);
  }

  static firestoreData(snap: firestoreDocumentSnapshot<BoardStatus, BoardStatusDoc>) {
    return BoardStatus._snapToThis(snap);
  }

  private static _snapToThis(snap: firestoreDocumentSnapshot<BoardStatus, BoardStatusDoc>) {

    const data = snap.data();

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
      boardTasksIds,
      snap.exists()
    );
  }
}
