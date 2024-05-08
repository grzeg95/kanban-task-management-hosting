import {collection as firestoreCollection, doc as firestoreDoc, DocumentReference as firestoreDocumentReference, DocumentSnapshot as firestoreDocumentSnapshot} from '@angular/fire/firestore';
import {collection as storeCollection, doc as storeDoc, DocumentReference as storeDocumentReference, DocumentSnapshot as storeDocumentSnapshot} from '@npm/store';
import {FirestoreDataConverter} from '@firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {Board} from './board';
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
    return firestoreDoc(boardTaskRef, Collections.boardTasks, id).withConverter(BoardTaskSubtask._conventer);
  }

  static firestoreRefs(boardTaskRef: firestoreDocumentReference<BoardTask, BoardTaskDoc>) {
    return firestoreCollection(boardTaskRef, Collections.boardTaskSubtasks).withConverter(BoardTaskSubtask._conventer);
  }

  static firestoreData(boardTaskSubtaskSnap: firestoreDocumentSnapshot<BoardTaskSubtask, BoardTaskSubtaskDoc>) {
    return boardTaskSubtaskSnap.data() || new BoardTaskSubtask();
  }

  static storeRef(boardTaskRef: storeDocumentReference, id: string) {
    return storeDoc(boardTaskRef.parentReference, [boardTaskRef.id, Collections.boardTasks, id].join('/'));
  }

  static storeRefs(boardTaskRef: storeDocumentReference, boardTask: BoardTask) {

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
        boardTaskSubtaskSnap.data['id'] as string,
        boardTaskSubtaskSnap.data['title'] as string,
        boardTaskSubtaskSnap.data['isCompleted'] as boolean
      );
    }

    return new BoardTaskSubtask(boardTaskSubtaskSnap.id);
  }
}
