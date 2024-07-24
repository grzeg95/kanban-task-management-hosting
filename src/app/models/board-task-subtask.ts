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
import {BoardTask} from './board-task';

export interface BoardTaskSubtaskDoc extends DocumentData {
  readonly title: string;
  readonly isCompleted: boolean;
}

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

  static firestoreRef(ref: firestoreDocumentReference<BoardTask>, id: string) {
    return firestoreDoc(ref, Collections.boardTaskSubtasks, id).withConverter(BoardTaskSubtask._converter);
  }

  static firestoreRefs(ref: firestoreDocumentReference<BoardTask>) {
    return firestoreCollection(ref, Collections.boardTaskSubtasks).withConverter(BoardTaskSubtask._converter);
  }

  static firestoreData(snap: firestoreDocumentSnapshot<BoardTaskSubtask>) {
    return BoardTaskSubtask._snapToThis(snap);
  }

  private static _snapToThis(snap: firestoreDocumentSnapshot<BoardTaskSubtask>) {

    const data = snap.data();

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
