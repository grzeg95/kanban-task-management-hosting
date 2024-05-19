import {
  collection as firestoreCollection,
  doc as firestoreDoc,
  DocumentReference as firestoreDocumentReference,
  DocumentSnapshot as firestoreDocumentSnapshot,
  FirestoreDataConverter
} from '@angular/fire/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {DocumentReference as storeDocumentReference, collection as storeCollection, DocumentSnapshot as storeDocumentSnapshot} from '../utils/store';
import {BoardTask, BoardTaskDoc} from './board-task';

export type BoardTaskSubtaskDoc = {
  title: string;
  isCompleted: boolean;
};

export class BoardTaskSubtask implements BoardTaskSubtaskDoc {

  constructor(
    public id: string = '',
    public title: string = '',
    public isCompleted: boolean = false
  ) {
  }

  private static _conventer = {
    toFirestore: (boardTaskSubtaskDoc: BoardTaskSubtaskDoc) => cloneDeep(boardTaskSubtaskDoc),
    fromFirestore: (snap) => {

      const data = cloneDeep(snap.data()) as BoardTaskSubtaskDoc;

      return new BoardTaskSubtask(
        snap.id,
        data.title,
        data.isCompleted
      );
    }
  } as FirestoreDataConverter<BoardTaskSubtask, BoardTaskSubtaskDoc>;

  static firestoreRef(boardTaskRef: firestoreDocumentReference<BoardTask, BoardTaskDoc>, id: string) {
    return firestoreDoc(boardTaskRef, Collections.boardTaskSubtasks, id).withConverter(BoardTaskSubtask._conventer);
  }

  static firestoreRefs(boardTaskRef: firestoreDocumentReference<BoardTask, BoardTaskDoc>) {
    return firestoreCollection(boardTaskRef, Collections.boardTaskSubtasks).withConverter(BoardTaskSubtask._conventer);
  }

  static firestoreData(boardTaskSubtaskSnap: firestoreDocumentSnapshot<BoardTaskSubtask, BoardTaskSubtaskDoc>) {
    return boardTaskSubtaskSnap.data() || new BoardTaskSubtask();
  }

  static storeRef(boardTaskRef: storeDocumentReference, id?: string) {
    const boardTaskCollectionRef = boardTaskRef.collection(Collections.boardTaskSubtasks);
    let boardTaskSubtaskRef;

    if (!id) {
      boardTaskSubtaskRef = boardTaskCollectionRef.doc();
    } else {
      boardTaskSubtaskRef = boardTaskCollectionRef.doc(id);
    }

    return boardTaskSubtaskRef;
  }

  static storeRefs(boardTaskRef: storeDocumentReference) {
    return storeCollection(boardTaskRef, Collections.boardTaskSubtasks);
  }

  static storeRefsFromBoardTask(boardTaskRef: storeDocumentReference, boardTask: BoardTask) {

    const boardTaskSubtasksCollectionRef = boardTaskRef.collection(Collections.boardTaskSubtasks);
    const boardTaskSubtasksRefs = [];

    for (const boardTaskSubtaskId of boardTask.boardTaskSubtasksIds) {
      boardTaskSubtasksRefs.push(boardTaskSubtasksCollectionRef.doc(boardTaskSubtaskId));
    }

    return boardTaskSubtasksRefs;
  }

  static storeData(boardTaskSubtaskSnap: storeDocumentSnapshot) {

    if (boardTaskSubtaskSnap.exists) {
      return new BoardTaskSubtask(
        boardTaskSubtaskSnap.id,
        boardTaskSubtaskSnap.data['title'] as string,
        boardTaskSubtaskSnap.data['isCompleted'] as boolean
      );
    }

    return new BoardTaskSubtask(boardTaskSubtaskSnap.id);
  }
}
