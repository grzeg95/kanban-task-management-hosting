import {collection, doc, DocumentReference, DocumentSnapshot} from '@angular/fire/firestore';
import {FirestoreDataConverter} from '@firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
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

  static ref(boardTaskRef: DocumentReference<BoardTask, BoardTaskDoc>, id: string) {
    return doc(boardTaskRef, Collections.boardTasks, id).withConverter(BoardTaskSubtask._conventer);
  }

  static refs(boardTaskRef: DocumentReference<BoardTask, BoardTaskDoc>) {
    return collection(boardTaskRef, Collections.boardTaskSubtasks).withConverter(BoardTaskSubtask._conventer);
  }

  static data(boardTaskSubtaskSnap: DocumentSnapshot<BoardTaskSubtask, BoardTaskSubtaskDoc>) {
    return boardTaskSubtaskSnap.data() || new BoardTaskSubtask();
  }
}
