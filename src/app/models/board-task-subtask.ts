import {collection, doc, DocumentReference, DocumentSnapshot, Firestore} from '@angular/fire/firestore';
import {FirestoreDataConverter} from '@firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {Board, BoardDoc} from './board';
import {BoardTask} from './board-task';

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

  static ref(boardRef: DocumentReference<Board, BoardDoc>, id: string) {
    return doc(boardRef, Collections.boardTasks, id).withConverter(BoardTaskSubtask._conventer);
  }

  static refs(firestore: Firestore, boardId: string, boardTaskId: string) {

    const boardRef = Board.ref(firestore, boardId);
    const boardTaskRef = BoardTask.ref(boardRef, boardTaskId);

    return collection(boardTaskRef, Collections.boardTaskSubtasks).withConverter(BoardTaskSubtask._conventer);
  }

  static data(boardTaskSubtaskSnap: DocumentSnapshot<BoardTaskSubtask, BoardTaskSubtaskDoc>) {
    return boardTaskSubtaskSnap.data() || new BoardTaskSubtask();
  }
}
