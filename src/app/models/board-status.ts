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

export interface BoardStatusDoc extends DocumentData {
  readonly name: string;
  readonly boardTasksIds: string[];
}

export class BoardStatus implements BoardStatusDoc {

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly boardTasksIds: string[]
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: BoardStatus._snapToThis
  } as FirestoreDataConverter<BoardStatus, BoardStatusDoc>;

  static firestoreRef(ref: firestoreDocumentReference<Board>, statusId: string) {
    return firestoreDoc(ref, Collections.boardStatuses, statusId).withConverter(BoardStatus._converter);
  }

  static firestoreCollectionRef(ref: firestoreDocumentReference<Board>) {
    return firestoreCollection(ref, Collections.boardStatuses).withConverter(BoardStatus._converter);
  }

  static firestoreData(snap: firestoreDocumentSnapshot<BoardStatus>) {
    return BoardStatus._snapToThis(snap);
  }

  private static _snapToThis(snap: firestoreDocumentSnapshot<BoardStatus>) {

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
      boardTasksIds
    );
  }
}
