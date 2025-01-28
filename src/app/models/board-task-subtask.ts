import {
  collection,
  doc,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  FirestoreDataConverter
} from 'firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';
import {BoardTask, BoardTaskDoc} from './board-task';

export interface BoardTaskSubtaskDoc extends DocumentData {
  readonly title: string;
  readonly isCompleted: boolean;
}

export class BoardTaskSubtask implements BoardTaskSubtaskDoc {

  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly isCompleted: boolean,
    public readonly exists: boolean
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: BoardTaskSubtask._snapToThis
  } as FirestoreDataConverter<BoardTaskSubtask, BoardTaskSubtaskDoc>;

  static firestoreRef(ref: DocumentReference<BoardTask, BoardTaskDoc>, id: string) {
    return doc(ref, Collections.boardTaskSubtasks, id).withConverter(BoardTaskSubtask._converter);
  }

  static firestoreRefs(ref: DocumentReference<BoardTask, BoardTaskDoc>) {
    return collection(ref, Collections.boardTaskSubtasks).withConverter(BoardTaskSubtask._converter);
  }

  static firestoreData(snap: DocumentSnapshot<BoardTaskSubtask, BoardTaskSubtaskDoc>) {
    return BoardTaskSubtask._snapToThis(snap);
  }

  private static _snapToThis(snap: DocumentSnapshot<BoardTaskSubtask, BoardTaskSubtaskDoc>) {

    const data = snap.data();

    let title = '';
    let isCompleted = false;

    data?.['title'] && typeof data['title'] === 'string' && data['title'].length > 0 && (title = data['title']);
    data?.['isCompleted'] && typeof data['isCompleted'] === 'boolean' && (isCompleted = data['isCompleted']);

    return new BoardTaskSubtask(
      snap.id,
      title,
      isCompleted,
      snap.exists()
    );
  }
}
