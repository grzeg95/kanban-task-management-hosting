import {DocumentSnapshot as firestoreDocumentSnapshot} from '@firebase/firestore';
import {doc as firestoreDoc, DocumentData, Firestore, FirestoreDataConverter} from '@angular/fire/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';

export interface ConfigDoc extends DocumentData {
  readonly maxUserBoards: number;
  readonly maxBoardStatuses: number;
  readonly maxBoardTasks: number;
  readonly maxBoardTaskSubtasks: number;
}

export class Config implements ConfigDoc {

  constructor(
    public readonly id: string,
    public readonly maxUserBoards: number,
    public readonly maxBoardStatuses: number,
    public readonly maxBoardTasks: number,
    public readonly maxBoardTaskSubtasks: number
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: Config._snapToThis
  } as FirestoreDataConverter<Config, ConfigDoc>;

  static firestoreRef(firestore: Firestore, id: string) {
    return firestoreDoc(firestore, Collections.configs, id).withConverter(Config._converter);
  }

  static firestoreData(snap: firestoreDocumentSnapshot<Config>) {
    return Config._snapToThis(snap);
  }

  private static _snapToThis(snap: firestoreDocumentSnapshot<Config>) {

    const data = snap.data();

    let maxUserBoards = 5;
    let maxBoardStatuses = 5;
    let maxBoardTasks = 20;
    let maxBoardTaskSubtasks = 10;

    data?.['maxUserBoards'] && typeof data['maxUserBoards'] === 'number' && data['maxUserBoards'] > 0 && (maxUserBoards = data['maxUserBoards']);
    data?.['maxBoardStatuses'] && typeof data['maxBoardStatuses'] === 'number' && data['maxBoardStatuses'] > 0 && (maxBoardStatuses = data['maxBoardStatuses']);
    data?.['maxBoardTasks'] && typeof data['maxBoardTasks'] === 'number' && data['maxBoardTasks'] > 0 && (maxBoardTasks = data['maxBoardTasks']);
    data?.['maxBoardTaskSubtasks'] && typeof data['maxBoardTaskSubtasks'] === 'number' && data['maxBoardTaskSubtasks'] > 0 && (maxBoardTaskSubtasks = data['maxBoardTaskSubtasks']);

    return new Config(
      snap.id,
      maxUserBoards,
      maxBoardStatuses,
      maxBoardTasks,
      maxBoardTaskSubtasks
    );
  }
}
