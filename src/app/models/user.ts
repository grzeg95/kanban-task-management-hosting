import {
  doc,
  DocumentData,
  DocumentSnapshot,
  Firestore,
  FirestoreDataConverter
} from 'firebase/firestore';
import cloneDeep from 'lodash/cloneDeep';
import {Collections} from '../services/firebase/collections';

export interface UserDoc extends DocumentData {
  readonly disabled: boolean;
  readonly boardsIds: string[];
  readonly darkMode: boolean | null;
  readonly config: {
    readonly maxUserBoards: number;
    readonly maxBoardStatuses: number;
    readonly maxBoardTasks: number;
    readonly maxBoardTaskSubtasks: number;
  };
  readonly configLoaded: boolean;
}

export class User implements UserDoc {

  constructor(
    public readonly id: string,
    public readonly disabled: boolean,
    public readonly boardsIds: string[],
    public readonly darkMode: boolean | null,
    public readonly config: {
      readonly maxUserBoards: number,
      readonly maxBoardStatuses: number,
      readonly maxBoardTasks: number,
      readonly maxBoardTaskSubtasks: number
    },
    public readonly configLoaded: boolean,
    public readonly exists: boolean
  ) {
  }

  private static _converter = {
    toFirestore: cloneDeep,
    fromFirestore: User._snapToThis
  } as FirestoreDataConverter<User, UserDoc>;

  static firestoreRef(firestore: Firestore, id: string) {
    return doc(firestore, Collections.users, id).withConverter(User._converter);
  }

  static firestoreData(snap: DocumentSnapshot<User, UserDoc>) {
    return User._snapToThis(snap);
  }

  private static _snapToThis(snap: DocumentSnapshot<User, UserDoc>) {

    const data = snap.data();

    let disabled = false;
    let boardsIds: string[] = [];
    let darkMode = null;

    data?.['disabled'] && typeof data['disabled'] === 'boolean' && (disabled = data['disabled']);

    if (
      data?.['boardsIds'] &&
      Array.isArray(data['boardsIds']) &&
      !data['boardsIds'].some((e) => typeof e !== 'string')
    ) {
      boardsIds = data['boardsIds'];
    }

    data?.['darkMode'] && (typeof data['darkMode'] === 'boolean' || data['darkMode'] === null) && (darkMode = data['darkMode']);

    const config = {
      maxUserBoards: 5,
      maxBoardStatuses: 5,
      maxBoardTasks: 20,
      maxBoardTaskSubtasks: 10
    };

    data?.['config']?.['maxUserBoards'] && (typeof data['config']['maxUserBoards'] === 'number') && (data['config']['maxUserBoards'] > 0) && (config.maxUserBoards = data['config']['maxUserBoards']);
    data?.['config']?.['maxBoardStatuses'] && typeof data['config']['maxBoardStatuses'] === 'number' && data['config']['maxBoardStatuses'] > 0 && (config.maxBoardStatuses = data['config']['maxBoardStatuses']);
    data?.['config']?.['maxBoardTasks'] && typeof data['config']['maxBoardTasks'] === 'number' && data['config']['maxBoardTasks'] > 0 && (config.maxBoardTasks = data['config']['maxBoardTasks']);
    data?.['config']?.['maxBoardTaskSubtasks'] && typeof data['config']['maxBoardTaskSubtasks'] === 'number' && data['config']['maxBoardTaskSubtasks'] > 0 && (config.maxBoardTaskSubtasks = data['config']['maxBoardTaskSubtasks']);

    let configLoaded = false;

    data?.['configLoaded'] && (typeof data['configLoaded'] === 'boolean' || data['configLoaded'] === null) && (configLoaded = data['configLoaded']);

    return new User(
      snap.id,
      disabled,
      boardsIds,
      darkMode,
      config,
      configLoaded,
      snap.exists()
    );
  }
}
