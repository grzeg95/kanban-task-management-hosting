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
import {
  collection as storeCollection,
  DocumentReference as storeDocumentReference,
  DocumentSnapshot as storeDocumentSnapshot
} from '../utils/store';
import {BoardTask, BoardTaskDoc} from './board-task';

export type BoardTaskSubtaskDoc = {
  title: string;
  isCompleted: boolean;
};

export class BoardTaskSubtask implements BoardTaskSubtaskDoc {

  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly isCompleted: boolean
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: BoardTaskSubtask._snapToThis
  } as FirestoreDataConverter<BoardTaskSubtask, BoardTaskSubtaskDoc>;

  static firestoreRef(ref: firestoreDocumentReference<BoardTask, BoardTaskDoc>, id: string) {
    return firestoreDoc(ref, Collections.boardTaskSubtasks, id).withConverter(BoardTaskSubtask._converter);
  }

  static firestoreRefs(ref: firestoreDocumentReference<BoardTask, BoardTaskDoc>) {
    return firestoreCollection(ref, Collections.boardTaskSubtasks).withConverter(BoardTaskSubtask._converter);
  }

  static firestoreData(snap: firestoreDocumentSnapshot<BoardTaskSubtask, BoardTaskSubtaskDoc>) {
    return BoardTaskSubtask._snapToThis(snap);
  }

  static storeRef(ref: storeDocumentReference, id?: string) {
    const boardTaskCollectionRef = ref.collection(Collections.boardTaskSubtasks);
    let boardTaskSubtaskRef;

    if (!id) {
      boardTaskSubtaskRef = boardTaskCollectionRef.doc();
    } else {
      boardTaskSubtaskRef = boardTaskCollectionRef.doc(id);
    }

    return boardTaskSubtaskRef;
  }

  static storeRefs(ref: storeDocumentReference) {
    return storeCollection(ref, Collections.boardTaskSubtasks);
  }

  static storeRefsFromBoardTask(ref: storeDocumentReference, boardTask: BoardTask) {

    const boardTaskSubtasksCollectionRef = ref.collection(Collections.boardTaskSubtasks);
    const boardTaskSubtasksRefs = [];

    for (const boardTaskSubtaskId of boardTask.boardTaskSubtasksIds) {
      boardTaskSubtasksRefs.push(boardTaskSubtasksCollectionRef.doc(boardTaskSubtaskId));
    }

    return boardTaskSubtasksRefs;
  }

  static storeData(snap: storeDocumentSnapshot) {
    return BoardTaskSubtask._snapToThis(snap);
  }

  private static _snapToThis(snap: firestoreDocumentSnapshot<BoardTaskSubtask | DocumentData, BoardTaskSubtaskDoc> | storeDocumentSnapshot) {

    let data: any;

    if (snap instanceof firestoreDocumentSnapshot) {
      data = snap.data();
    } else {
      data = snap.data;
    }

    let title = '';
    let isCompleted = false;

    data?.['title'] && typeof data['title'] === 'string' && data['title'].length > 0 && (title = data['title']);
    data?.['isCompleted'] && typeof data['isCompleted'] === 'boolean' && (isCompleted = data['isCompleted']);

    return new BoardTaskSubtask(
      snap.id,
      title,
      isCompleted
    );
  }
}
