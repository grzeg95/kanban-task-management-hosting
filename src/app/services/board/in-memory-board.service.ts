import {Inject, Injectable} from '@angular/core';
import {DocumentSnapshotError} from '@npm/store/dist/objects';
import {collection, Data, getInMemory, InMemory, WriteBatch} from '@npm/store';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
  withLatestFrom
} from 'rxjs';
import {environment} from '../../../environments/environment';
import {KanbanConfig} from '../../kanban-config.token';
import {
  Board,
  BoardCreateData,
  BoardCreateResult,
  BoardDeleteData,
  BoardDeleteResult,
  BoardUpdateData,
  BoardUpdateResult
} from '../../models/board';
import {BoardStatus} from '../../models/board-status';
import {
  BoardTask,
  BoardTaskCreateData,
  BoardTaskCreateResult,
  BoardTaskDeleteData,
  BoardTaskDeleteResult,
  BoardTaskUpdateData,
  BoardTaskUpdateResult,
} from '../../models/board-task';
import {BoardTaskSubtask} from '../../models/board-task-subtask';
import {InMemoryError} from '../../models/in-memory-error';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {id} from '../../utils/id';
import {observerToRxjsObserver} from '../../utils/observer-to-rxjs-obeserver';
import {User, UserDoc} from '../auth/models/user';
import {UserBoard} from '../auth/models/user-board';
import {Collections} from '../firebase/collections';
import {SnackBarService} from '../snack-bar.service';
import {BoardServiceAbstract} from './board-service.abstract';
import {
  defaultInMemoryBoards,
  defaultInMemoryUsers,
  InMemoryBoard,
  InMemoryBoardTask,
  InMemoryStore,
  InMemoryUser
} from './data';
import {DocumentSnapshot, doc } from '@npm/store';

@Injectable({
  providedIn: 'root',
  useFactory: async (_snackBarService: SnackBarService, _kanbanConfig: KanbanConfig) => {
    const _inMemory = await getInMemory(environment.firebase.projectId);
    return new InMemoryBoardService(_inMemory, _snackBarService, _kanbanConfig);
  },
  deps: [SnackBarService, KanbanConfig]
})
export class InMemoryBoardService extends BoardServiceAbstract {

  // conventer

  private _userId = '0';

  private _inMemoryUser$ = observerToRxjsObserver<DocumentSnapshot, DocumentSnapshotError>(doc(this._inMemory, `users/${this._userId}`).snapshots).pipe(
    getProtectedRxjsPipe(),
    map((value) => {
      return (value.exists && value.data as InMemoryUser) || null;
    }),
    getProtectedRxjsPipe()
  );

  override user$ = this._inMemoryUser$.pipe(
    map((inMemoryUser) => {

      if (inMemoryUser === null) {
        return null;
      }

      const user: User = {
        id: inMemoryUser.id,
        disabled: inMemoryUser.disabled,
        boardsIds: inMemoryUser.boardsIds,
        darkMode: inMemoryUser.darkMode
      };

      return user;
    }),
    getProtectedRxjsPipe()
  );

  override userBoards$ = this._inMemoryUser$.pipe(
    map((inMemoryUser) => {

      if (inMemoryUser === null) {
        return null;
      }

      return inMemoryUser.boardsIds.map((boardId) => {
        return inMemoryUser.userBoards[boardId];
      });
    }),
    getProtectedRxjsPipe()
  );

  private _inMemoryBoard$ = this.boardId$.pipe(
    getProtectedRxjsPipe(),
    switchMap((boardId) => {

      if (boardId === null) {
        return of(null);
      }

      if (boardId === undefined) {
        return of(undefined);
      }

      return observerToRxjsObserver<DocumentSnapshot, DocumentSnapshotError>(doc(this._inMemory, `boards/${boardId}`).snapshots).pipe(
        getProtectedRxjsPipe(),
        map((value) => {
          return (value.exists && value.data as InMemoryBoard) || null;
        })
      );
    }),
    getProtectedRxjsPipe()
  );

  override board$ = this._inMemoryBoard$.pipe(
    map((inMemoryBoard) => {

      if (inMemoryBoard === null) {
        return null;
      }

      if (inMemoryBoard == undefined) {
        return undefined;
      }

      const board: Board = {
        id: inMemoryBoard.id,
        name: inMemoryBoard.name,
        boardStatusesIds: inMemoryBoard.boardStatusesIds,
        boardTasksIds: inMemoryBoard.boardTasksIds
      };

      return board;
    }),
    getProtectedRxjsPipe()
  );

  override boardStatuses$ = this._inMemoryBoard$.pipe(
    map((inMemoryBoard) => {

      if (inMemoryBoard === null) {
        return null;
      }

      return inMemoryBoard?.boardStatuses || {};
    }),
    getProtectedRxjsPipe()
  );

  override boardTasks$ = this._inMemoryBoard$.pipe(
    map((inMemoryBoard) => {

      const inMemoryBoardTasks = inMemoryBoard?.boardTasks;

      if (inMemoryBoardTasks === null) {
        return null;
      }

      if (inMemoryBoardTasks === undefined) {
        return undefined;
      }

      const boardTasks: { [key in string]: BoardTask } = {};

      for (const inMemoryBoardTaskId of Object.getOwnPropertyNames(inMemoryBoardTasks)) {

        const inMemoryBoardTask = inMemoryBoardTasks[inMemoryBoardTaskId];

        const boardTask: BoardTask = {
          id: inMemoryBoardTask.id,
          title: inMemoryBoardTask.title,
          description: inMemoryBoardTask.description,
          boardTaskSubtasksIds: inMemoryBoardTask.boardTaskSubtasksIds,
          boardStatusId: inMemoryBoardTask.boardStatusId,
          completedBoardTaskSubtasks: inMemoryBoardTask.completedBoardTaskSubtasks
        };

        Object.assign(boardTasks, {[boardTask.id]: boardTask});
      }

      return boardTasks;
    }),
    getProtectedRxjsPipe()
  );

  private _inMemoryBoardTask$ = combineLatest([
    this._inMemoryBoard$,
    this.boardTaskId$.pipe(getProtectedRxjsPipe())
  ]).pipe(
    map(([inMemoryBoard, boardTaskId]) => {

      if (inMemoryBoard === undefined || boardTaskId === undefined) {
        return undefined;
      }

      if (inMemoryBoard === null || boardTaskId === null) {
        return null;
      }

      const inMemoryBoardTasks = inMemoryBoard.boardTasks;

      if (!inMemoryBoardTasks) {
        return null;
      }

      return inMemoryBoardTasks[boardTaskId] || null;
    }),
    getProtectedRxjsPipe()
  );

  override boardTask$ = this._inMemoryBoardTask$.pipe(
    map((inMemoryBoardTask) => {

      if (inMemoryBoardTask === null) {
        return null;
      }

      if (inMemoryBoardTask === undefined) {
        return undefined;
      }

      const boardTask: BoardTask = {
        id: inMemoryBoardTask.id,
        title: inMemoryBoardTask.title,
        description: inMemoryBoardTask.description,
        boardTaskSubtasksIds: inMemoryBoardTask.boardTaskSubtasksIds,
        boardStatusId: inMemoryBoardTask.boardStatusId,
        completedBoardTaskSubtasks: inMemoryBoardTask.completedBoardTaskSubtasks
      };

      return boardTask;
    }),
    getProtectedRxjsPipe()
  );

  override boardTaskSubtasks$ = this._inMemoryBoardTask$.pipe(
    map((inMemoryBoardTask) => {

      if (inMemoryBoardTask === null) {
        return null;
      }

      if (inMemoryBoardTask === undefined) {
        return undefined;
      }

      return inMemoryBoardTask.boardTaskSubtasks || null;
    }),
    getProtectedRxjsPipe()
  );

  constructor(
    private readonly _inMemory: InMemory,
    private readonly _snackBarService: SnackBarService,
    @Inject(KanbanConfig) private readonly _kanbanConfig: KanbanConfig
  ) {
    super();
  }

  private _Request<RequestResult>(request: () => Promise<RequestResult>) {
    return from(request()).pipe(
      catchError((error: Error) => {

        if (!(error instanceof InMemoryError)) {
          error = new InMemoryError();
        }

        this._snackBarService.open(error.message, 3000);

        throw error;
      })
    );
  }

  boardCreate(data: BoardCreateData) {

    return this._Request<BoardCreateResult>(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = User.storeRef(this._inMemory, this._userId);
      const userSnap = await userRef.get();
      const user = User.storeData(userSnap);

      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(user.boardsIds.length >= this._kanbanConfig.maxUserBoards, {
        code: 'resource-exhausted',
        message: `User can have ${this._kanbanConfig.maxUserBoards} boards`
      });

      InMemoryError.testRequirement(data.boardStatusesNames.length > this._kanbanConfig.maxBoardStatuses, {
        code: 'resource-exhausted',
        message: `Board can have ${this._kanbanConfig.maxBoardStatuses} statuses`
      });

      const boardRef = Board.storeRef(this._inMemory);

      const boardStatusesIds: string[] = [];

      for (const boardStatusName of data.boardStatusesNames) {

        const boardStatusRef = boardRef.collection(Collections.boardStatuses).doc();

        const boardStatus = {
          name: boardStatusName,
          boardTasksIds: [] as string[]
        } as BoardStatus & Data;

        writeBatch.create(boardStatusRef, boardStatus);
        boardStatusesIds.push(boardStatusRef.id);
      }

      const board = {
        name: data.name,
        boardStatusesIds,
        boardTasksIds: [] as string[]
      } as Board & Data;

      writeBatch.create(boardRef, board);

      const boardsIds = [...user.boardsIds, boardRef.id];

      if (!userSnap.exists) {
        writeBatch.create(userSnap.reference, {
          boardsIds
        } as User & Data);
      } else {
        writeBatch.update(userSnap.reference, {
          boardsIds
        } as User & Data);
      }

      const userBoardRef = userSnap.reference.collection(Collections.userBoards).doc(boardRef.id);
      writeBatch.create(userBoardRef, {
        name: data.name
      } as UserBoard & Data);

      await writeBatch.commit();

      return {
        id: boardRef.id,
        boardsIds,
        boardStatusesIds
      };
    }).pipe(
      tap(() => {
        this._snackBarService.open('Board has been created', 3000);
      })
    );
  }

  boardDelete(data: BoardDeleteData) {

    return this._Request<BoardDeleteResult>(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = doc(this._inMemory, `${Collections.users}/${this._userId}`);
      const userSnap = await userRef.get();
      const user = userSnap.data as UserDoc;
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId) => boardId === data.id), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const boardRef = Board.storeRef(this._inMemory, data.id);
      const boardSnap = await boardRef.get();
      const board = Board.storeData(boardSnap);
      writeBatch.delete(boardSnap.reference);

      const boardTasksRefs = BoardTask.storeRefs(boardSnap.reference, board);
      const boardTasksSnapsPromise: Promise<DocumentSnapshot>[] = [];

      for (const boardTasksRef of boardTasksRefs) {
        boardTasksSnapsPromise.push(boardTasksRef.get());
      }

      const boardTasksSnaps = await Promise.all(boardTasksSnapsPromise);

      const boardTasksSubtasksRefs = [];
      for (const boardTaskSnap of boardTasksSnaps) {
        writeBatch.delete(boardTaskSnap.reference);
        const boardTask = BoardTask.storeData(boardTaskSnap)!;
        boardTasksSubtasksRefs.push(BoardTaskSubtask.storeRefs(boardTaskSnap.reference, boardTask));
      }
      const boardTasksSubtasksSnapsPromises = [];

      for (const boardTaskSubtasksRefs of boardTasksSubtasksRefs) {
        boardTasksSubtasksSnapsPromises.push(transactionGetAll(transaction, boardTaskSubtasksRefs));
      }

      const boardTasksSubtasksSnaps = await Promise.all(boardTasksSubtasksSnapsPromises);

      for (const boardTaskSubtasksSnaps of boardTasksSubtasksSnaps) {
        writeBatch.deleteAll(boardTaskSubtasksSnaps);
      }

      const boardStatusesRefs = BoardStatus.storeCollectionRefs(boardRef, board);
      const boardStatusesSnaps = await transactionGetAll(transaction, boardStatusesRefs);

      writeBatch.deleteAll(boardStatusesSnaps);

      const boardsIds = user.boardsIds.filter((boardId) => boardId !== data.id);

      const userBoardRef = userSnap.reference.collection(Collections.userBoards).doc(boardRef.id);
      writeBatch.delete(userBoardRef);

      writeBatch.update(userSnap.reference, {
        boardsIds
      });

      await writeBatch.commit();

      return {
        boardsIds
      };
    }).pipe(
      tap(() => {
        this._snackBarService.open('Board has been deleted', 3000);
      })
    );
  }

  boardUpdate(data: BoardUpdateData) {

    return this._Request<BoardUpdateResult>(() => {

    }).pipe(
      tap(() => {
        this._snackBarService.open('Board has been updated', 3000);
      })
    );
  }

  boardTaskCreate(data: BoardTaskCreateData) {

    return this._Request<BoardTaskCreateResult>(() => {

    }).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been created', 3000);
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult> {

    return this._Request<BoardTaskDeleteResult>(() => {

    }).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been deleted', 3000);
      })
    );
  }

  boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult> {

    return this._Request(() => {

    }).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been updated', 3000);
      })
    );
  }

  updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardId: string, boardTaskId: string, boardTaskSubtaskId: string) {

    return this._Request(() => {

    });
  }

  loadDefault() {
    this._inMemoryStore$.next({
      users: defaultInMemoryUsers,
      boards: defaultInMemoryBoards,
    });
  }
}
