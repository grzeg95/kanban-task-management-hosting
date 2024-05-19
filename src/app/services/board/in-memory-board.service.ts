import {Inject, Injectable} from '@angular/core';
import {catchError, combineLatest, from, map, Observable, of, switchMap, tap} from 'rxjs';
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
import {User, UserDoc} from '../../models/user';
import {UserBoard} from '../../models/user-board';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {Data, doc, DocumentSnapshot, InMemory, WriteBatch} from '../../utils/store';
import {tapOnce} from '../../utils/tap-once.rxjs-pipe';
import {tapTimeoutRxjsPipe} from '../../utils/tap-timeout.rxjs-pipe';
import {Collections} from '../firebase/collections';
import {SnackBarService} from '../snack-bar.service';
import {BoardServiceAbstract} from './board-service.abstract';

@Injectable({
  providedIn: 'root'
})
export class InMemoryBoardService extends BoardServiceAbstract {

  private _userId = '0';

  override user$ = new Observable<DocumentSnapshot>((subscriber) => {

    const unsubscribe = doc(this._inMemory, `users/${this._userId}`).snapshots({
      next: subscriber.next.bind(subscriber),
      error: subscriber.error.bind(subscriber),
      complete: subscriber.complete.bind(subscriber)
    });
    return {unsubscribe};
  }).pipe(
    map(User.storeData),
    getProtectedRxjsPipe(),
    tapOnce(() => {
      this.firstLoadingUserBoards$.next(true);
      this.firstLoadingBoard$.next(true);
      this.firstLoadingBoardStatuses$.next(true);
      this.firstLoadingBoardTasks$.next(true);
      this.firstLoadingBoardTask$.next(true);
      this.firstLoadingBoardTaskSubtasks$.next(true);
    })
  );

  override userBoards$ = this.user$.pipe(
    tap(() => this.loadingUserBoards$.next(true)),
    switchMap((user) => {

      if (user === null) {
        return of(null);
      }

      if (user === undefined) {
        return of(undefined);
      }

      const userBoardCollectionRef = UserBoard.storeCollectionRef(User.storeRef(this._inMemory, user.id));

      return new Observable<DocumentSnapshot[]>((subscriber) => {

        const unsubscribe = userBoardCollectionRef.snapshots({
          next: subscriber.next.bind(subscriber),
          error: subscriber.error.bind(subscriber),
          complete: subscriber.complete.bind(subscriber)
        });
        return {unsubscribe};
      }).pipe(
        map((userBoardsDocumentSnapshots) => {

          const userBoardMap = new Map<string, UserBoard>();

          for (const userBoardsDocumentSnapshot of userBoardsDocumentSnapshots) {
            userBoardMap.set(userBoardsDocumentSnapshot.id, UserBoard.storeData(userBoardsDocumentSnapshot));
          }

          return user.boardsIds.map((boardId) => {
            return userBoardMap.get(boardId);
          }).filter((userBoard) => !!userBoard) as UserBoard[];
        })
      );
    }),
    tapTimeoutRxjsPipe(() => {
      this.loadingUserBoards$.next(false);
      this.firstLoadingUserBoards$.next(false);
    }),
    getProtectedRxjsPipe()
  );

  override board$ = combineLatest([
    this.boardId$.pipe(
      getProtectedRxjsPipe(),
      tap(() => {
        this.firstLoadingBoard$.next(true);
        this.firstLoadingBoardStatuses$.next(true);
        this.firstLoadingBoardTasks$.next(true);
      })
    ),
    this.user$
  ]).pipe(
    tap(() => this.loadingBoard$.next(true)),
    switchMap(([boardId, user]) => {

      if (boardId === null || user === null) {
        return of(null);
      }

      if (user === undefined || boardId === undefined) {
        return of(undefined);
      }

      const boardRef = Board.storeRef(this._inMemory, boardId);

      return new Observable<DocumentSnapshot>((subscriber) => {

        const unsubscribe = boardRef.snapshots({
          next: subscriber.next.bind(subscriber),
          error: subscriber.error.bind(subscriber),
          complete: subscriber.complete.bind(subscriber)
        });
        return {unsubscribe};
      }).pipe(
        map((boardSnap) => {

          if (!boardSnap.exists) {
            return null;
          }

          return Board.storeData(boardSnap);
        })
      );
    }),
    tapTimeoutRxjsPipe(() => {
      this.loadingBoard$.next(false);
      this.firstLoadingBoard$.next(false);
    }),
    getProtectedRxjsPipe()
  );

  override boardStatuses$ = combineLatest([
    this.board$,
    this.user$
  ]).pipe(
    tap(() => this.loadingBoardStatuses$.next(true)),
    switchMap(([board, user]) => {

      if (board === null || user === null) {
        return of(null);
      }

      if (board === undefined || user === undefined) {
        return of(undefined);
      }

      const boardRef = Board.storeRef(this._inMemory, board.id);
      const boardStatusesRef = BoardStatus.storeCollectionRef(boardRef);

      return new Observable<DocumentSnapshot[]>((subscriber) => {

        const unsubscribe = boardStatusesRef.snapshots({
          next: subscriber.next.bind(subscriber),
          error: subscriber.error.bind(subscriber),
          complete: subscriber.complete.bind(subscriber)
        });
        return {unsubscribe};
      }).pipe(
        map((boardStatusesDocumentSnapshots) => {

          const boardStatuses: { [key in string]: BoardStatus } = {};

          for (const boardStatusesDocumentSnapshot of boardStatusesDocumentSnapshots) {
            Object.assign(boardStatuses, {[boardStatusesDocumentSnapshot.id]: BoardStatus.storeData(boardStatusesDocumentSnapshot)});
          }

          return boardStatuses;
        })
      );
    }),
    tapTimeoutRxjsPipe(() => {
      this.loadingBoardStatuses$.next(false);
      this.firstLoadingBoardStatuses$.next(false);
    }),
    getProtectedRxjsPipe()
  );

  override boardTasks$ = combineLatest([
    this.board$,
    this.user$
  ]).pipe(
    tap(() => this.loadingBoardTasks$.next(true)),
    switchMap(([board, user]) => {

      if (board === null || user === null) {
        return of(null);
      }

      if (board === undefined || user === undefined) {
        return of(undefined);
      }

      const boardRef = Board.storeRef(this._inMemory, board.id);
      const boardTasksRef = BoardTask.storeCollectionRef(boardRef);

      return new Observable<DocumentSnapshot[]>((subscriber) => {
        const unsubscribe = boardTasksRef.snapshots({
          next: subscriber.next.bind(subscriber),
          error: subscriber.error.bind(subscriber),
          complete: subscriber.complete.bind(subscriber)
        });
        return {unsubscribe};
      }).pipe(
        map((boardTasksDocumentSnapshots) => {

          const boardTasks: { [key in string]: BoardTask } = {};

          for (const boardTasksDocumentSnapshot of boardTasksDocumentSnapshots) {
            Object.assign(boardTasks, {[boardTasksDocumentSnapshot.id]: BoardTask.storeData(boardTasksDocumentSnapshot)});
          }

          return boardTasks;
        })
      );
    }),
    tapTimeoutRxjsPipe(() => {
      this.loadingBoardTasks$.next(false);
      this.firstLoadingBoardTasks$.next(false);
    }),
    getProtectedRxjsPipe()
  );

  override boardTask$ = combineLatest([
    this.boardTasks$,
    this.boardTaskId$.pipe(
      getProtectedRxjsPipe(),
      tap(() => {
        this.firstLoadingBoardTask$.next(true);
        this.firstLoadingBoardTaskSubtasks$.next(true);
      })
    )
  ]).pipe(
    tap(() => this.loadingBoardTask$.next(true)),
    map(([boardTasks, boardTaskId]) => {

      if (boardTasks === null || boardTaskId === null) {
        return null;
      }

      if (boardTasks === undefined || boardTaskId === undefined) {
        return undefined;
      }

      return boardTasks[boardTaskId] || null;
    }),
    tapTimeoutRxjsPipe(() => {
      this.loadingBoardTask$.next(false);
      this.firstLoadingBoardTask$.next(false);
    }),
    getProtectedRxjsPipe()
  );

  override boardTaskSubtasks$ = combineLatest([
    this.board$,
    this.boardTask$,
  ]).pipe(
    tap(() => this.loadingBoardTaskSubtasks$.next(true)),
    switchMap(([board, boardTask]) => {

      if (board === null || boardTask === null) {
        return of(null);
      }

      if (board === undefined || boardTask === undefined) {
        return of(undefined);
      }

      const boardRef = Board.storeRef(this._inMemory, board.id);
      const boardTaskRef = BoardTask.storeRef(boardRef, boardTask.id);
      const boardTaskSubtasksRef = BoardTaskSubtask.storeRefs(boardTaskRef);

      return new Observable<DocumentSnapshot[]>((subscriber) => {
        const unsubscribe = boardTaskSubtasksRef.snapshots({
          next: subscriber.next.bind(subscriber),
          error: subscriber.error.bind(subscriber),
          complete: subscriber.complete.bind(subscriber)
        });
        return {unsubscribe};
      }).pipe(
        map((boardTaskSubtasksDocumentSnapshots) => {

          const boardTaskSubtasks: { [key in string]: BoardTaskSubtask } = {};

          for (const boardTaskSubtasksDocumentSnapshot of boardTaskSubtasksDocumentSnapshots) {
            Object.assign(boardTaskSubtasks, {[boardTaskSubtasksDocumentSnapshot.id]: BoardTaskSubtask.storeData(boardTaskSubtasksDocumentSnapshot)});
          }

          return boardTaskSubtasks;
        }),
      );
    }),
    tapTimeoutRxjsPipe(() => {
      this.loadingBoardTaskSubtasks$.next(false);
      this.firstLoadingBoardTaskSubtasks$.next(false);
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

        console.error(error);

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

        this.loadingUserBoards$.next(true);

        if (this.boardId$.value) {
          this.loadingBoard$.next(true);
        }
      }),
      catchError((error) => {

        this.loadingUserBoards$.next(false);

        if (this.boardId$.value) {
          this.loadingBoard$.next(false);
        }

        throw error;
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
        boardTasksSubtasksRefs.push(BoardTaskSubtask.storeRefsFromBoardTask(boardTaskSnap.reference, boardTask));
      }
      const boardTasksSubtasksSnapsPromises = [];

      for (const boardTaskSubtasksRefs of boardTasksSubtasksRefs) {
        for (const boardTaskSubtasksRef of boardTaskSubtasksRefs) {
          boardTasksSubtasksSnapsPromises.push(boardTaskSubtasksRef.get());
        }
      }

      const boardTasksSubtasksSnaps = await Promise.all(boardTasksSubtasksSnapsPromises);

      for (const boardTaskSubtasksSnap of boardTasksSubtasksSnaps) {
        writeBatch.delete(boardTaskSubtasksSnap.reference);
      }

      const boardStatusesRefs = BoardStatus.storeCollectionRefs(boardRef, board);
      const boardStatusesSnapsPromises: Promise<DocumentSnapshot>[] = [];

      for (const boardStatusesRef of boardStatusesRefs) {
        boardStatusesSnapsPromises.push(boardStatusesRef.get());
      }
      const boardStatusesSnaps = await Promise.all(boardStatusesSnapsPromises);

      for (const boardStatusesSnap of boardStatusesSnaps) {
        writeBatch.delete(boardStatusesSnap.reference);
      }

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
        this.loadingUserBoards$.next(true);
      }),
      catchError((error) => {
        this.loadingUserBoards$.next(false);
        throw error;
      })
    );
  }

  boardUpdate(data: BoardUpdateData, boardNameWasChanged: boolean, boardStatusNameWasChanged: boolean, boardStatusAddedOrDeleted: boolean) {

    return this._Request<BoardUpdateResult>(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = User.storeRef(this._inMemory, this._userId);
      const userSnap = await userRef.get();
      const user = User.storeData(userSnap);
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId: string) => boardId === data.id), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const boardRef = Board.storeRef(this._inMemory, data.id);
      const boardSnap = await boardRef.get();
      const board = Board.storeData(boardSnap);

      const currentBoardStatusesIds = board.boardStatusesIds || [];
      const newBordStatusesIdsFromData = data.boardStatuses.filter((s) => s.id).map((s) => s.id) as string[];

      const boardStatusesIdsToRemove = currentBoardStatusesIds.toSet().difference(newBordStatusesIdsFromData.toSet());

      const boardStatusesRefsToRemove = [];

      for (const boardStatusIdToRemove of boardStatusesIdsToRemove) {
        boardStatusesRefsToRemove.push(BoardStatus.storeRef(boardSnap.reference, boardStatusIdToRemove));
      }

      const boardStatusesSnapsToRemovePromises: Promise<DocumentSnapshot>[] = [];

      for (const boardStatusesRefToRemove of boardStatusesRefsToRemove) {
        boardStatusesSnapsToRemovePromises.push(boardStatusesRefToRemove.get());
      }

      const boardStatusesSnapsToRemove = await Promise.all(boardStatusesSnapsToRemovePromises);

      const boardStatusesTasksRefsToRemove = [];

      for (const boardStatusSnapToRemove of boardStatusesSnapsToRemove) {
        writeBatch.delete(boardStatusSnapToRemove.reference);
        const boardStatus = BoardStatus.storeData(boardStatusSnapToRemove);
        boardStatusesTasksRefsToRemove.push(BoardTask.storeRefs(boardSnap.reference, boardStatus));
      }

      const boardStatusesTasksSnapsToRemovePromise: Promise<DocumentSnapshot>[] = [];

      for (const boardStatusTasksRefsToRemove of boardStatusesTasksRefsToRemove) {
        for (const boardStatusTasksRefToRemove of boardStatusTasksRefsToRemove) {
          boardStatusesTasksSnapsToRemovePromise.push(boardStatusTasksRefToRemove.get());
        }
      }

      const boardStatusesTasksSnapsToRemove = await Promise.all(boardStatusesTasksSnapsToRemovePromise);

      const tasksSubtasksSnapsToRemovePromise: Promise<DocumentSnapshot>[] = [];
      const tasksIdsToRemove = [];

      for (const boardStatusTaskSnapToRemove of boardStatusesTasksSnapsToRemove) {
        tasksIdsToRemove.push(boardStatusTaskSnapToRemove.id);
        writeBatch.delete(boardStatusTaskSnapToRemove.reference);
        const boardTask = BoardTask.storeData(boardStatusTaskSnapToRemove);
        for (const tasksSubtasksRefsToRemove of BoardTaskSubtask.storeRefsFromBoardTask(boardStatusTaskSnapToRemove.reference, boardTask)) {
          tasksSubtasksSnapsToRemovePromise.push(tasksSubtasksRefsToRemove.get());
        }
      }

      const tasksSubtasksSnapsToRemove = await Promise.all(tasksSubtasksSnapsToRemovePromise);

      for (const tasksSubtasksSnapToRemove of tasksSubtasksSnapsToRemove) {
        writeBatch.delete(tasksSubtasksSnapToRemove.reference);
      }

      const boardStatusesRefs = [];

      for (let i = 0; i < data.boardStatuses.length; ++i) {
        const boardStatusId = data.boardStatuses[i].id;
        const boardStatusRef = BoardStatus.storeRef(boardSnap.reference, boardStatusId);
        boardStatusesRefs.push(boardStatusRef);
      }

      const boardStatusesSnapsPromise: Promise<DocumentSnapshot>[] = []

      for (const boardStatusesRef of boardStatusesRefs) {
        boardStatusesSnapsPromise.push(boardStatusesRef.get());
      }

      const boardStatusesSnaps = await Promise.all(boardStatusesSnapsPromise);
      const boardStatusesIds = [];

      for (const [i, boardStatusSnap] of boardStatusesSnaps.entries()) {

        if (!boardStatusSnap.exists) {

          const boardStatus = {
            name: data.boardStatuses[i].name,
            boardTasksIds: [] as string[]
          };

          writeBatch.create(boardStatusSnap.reference, boardStatus);
        } else {
          writeBatch.update(boardStatusSnap.reference, {
            name: data.boardStatuses[i].name
          });
        }

        boardStatusesIds.push(boardStatusSnap.id);
      }

      InMemoryError.testRequirement(boardStatusesIds.length > this._kanbanConfig.maxBoardStatuses, {
        code: 'resource-exhausted',
        message: `Board can have ${this._kanbanConfig.maxBoardStatuses} statuses`
      });

      const boardTasksIds = board.boardTasksIds.toSet().difference(tasksIdsToRemove.toSet()).toArray();

      writeBatch.update(boardSnap.reference, {
        name: data.name,
        boardStatusesIds,
        boardTasksIds
      });

      const userBoardRef = UserBoard.storeRef(userSnap.reference, boardSnap.id);
      const userBoardSnap = await userBoardRef.get();
      writeBatch.update(userBoardSnap.reference, {
        name: data.name
      });

      await writeBatch.commit();

      return {
        boardStatusesIds,
        boardTasksIds
      };

    }).pipe(
      tap(() => {

        this._snackBarService.open('Board has been updated', 3000);

        if (this.boardId$.value) {
          if (boardNameWasChanged) {
            this.loadingBoard$.next(true);
            this.loadingUserBoards$.next(true);
          }

          if (boardStatusNameWasChanged || boardStatusAddedOrDeleted) {
            this.loadingBoardStatuses$.next(true);
          }

          if (boardStatusAddedOrDeleted) {
            this.loadingBoardTasks$.next(true);
          }
        }
      }),
      catchError((error) => {

        if (this.boardId$.value) {
          if (boardNameWasChanged) {
            this.loadingBoard$.next(false);
            this.loadingUserBoards$.next(false);
          }

          if (boardStatusNameWasChanged || boardStatusAddedOrDeleted) {
            this.loadingBoardStatuses$.next(false);
          }

          if (boardStatusAddedOrDeleted) {
            this.loadingBoardTasks$.next(false);
          }
        }

        throw error;
      })
    );
  }

  boardTaskCreate(data: BoardTaskCreateData) {

    return this._Request<BoardTaskCreateResult>(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = User.storeRef(this._inMemory, this._userId);
      const userSnap = await userRef.get();
      const user = User.storeData(userSnap);
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId: string) => boardId === data.boardId), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const boardRef = Board.storeRef(this._inMemory, data.boardId);
      const boardSnap = await boardRef.get();
      const board = Board.storeData(boardSnap);

      InMemoryError.testRequirement(board.boardTasksIds.length >= this._kanbanConfig.maxBoardTasks, {
        code: 'resource-exhausted',
        message: `Board can have ${this._kanbanConfig.maxBoardTasks} tasks`
      });

      InMemoryError.testRequirement(!board.boardStatusesIds.toSet().has(data.boardStatusId), {
        code: 'not-found',
        message: 'Status do not exist'
      });

      InMemoryError.testRequirement(data.boardTaskSubtasksTitles.length > this._kanbanConfig.maxBoardTaskSubtasks, {
        code: 'resource-exhausted',
        message: `Board task can have ${this._kanbanConfig.maxBoardTaskSubtasks} subtasks`
      });

      const boardStatusRef = BoardStatus.storeRef(boardSnap.reference, data.boardStatusId);
      const boardStatusSnap = await boardStatusRef.get();
      const boardStatus = BoardStatus.storeData(boardStatusSnap);

      const boardTaskRef = BoardTask.storeRef(boardSnap.reference);

      const boardTasksIds = [boardTaskRef.id, ...board.boardTasksIds];
      const boardStatusBoardTasksIds = [boardTaskRef.id, ...boardStatus.boardTasksIds];

      writeBatch.update(boardSnap.reference, {
        boardTasksIds: boardTasksIds
      });

      writeBatch.update(boardStatusSnap.reference, {
        boardTasksIds: boardStatusBoardTasksIds
      });

      const boardTaskSubtasksIds: string[] = [];

      for (const boardTaskSubtaskTitle of data.boardTaskSubtasksTitles) {

        const boardTaskSubtaskRef = BoardTaskSubtask.storeRef(boardTaskRef);

        writeBatch.create(boardTaskSubtaskRef, {
          title: boardTaskSubtaskTitle,
          isCompleted: false
        });

        boardTaskSubtasksIds.push(boardTaskSubtaskRef.id);
      }

      const boardTask = {
        title: data.title,
        description: data.description,
        boardTaskSubtasksIds,
        boardStatusId: boardStatusSnap.id,
        completedBoardTaskSubtasks: 0
      };

      writeBatch.create(boardTaskRef, boardTask);

      await writeBatch.commit();

      return {
        id: boardTaskRef.id,
        boardTasksIds,
        boardStatusBoardTasksIds,
        boardTaskSubtasksIds
      };
    }).pipe(
      tap(() => {

        this._snackBarService.open('Board task has been created', 3000);

        if (this.boardId$.value) {
          this.loadingBoardTasks$.next(true);
          this.loadingBoardStatuses$.next(true);
        }
      }),
      catchError((error) => {

        if (this.boardId$.value) {
          this.loadingBoardTasks$.next(false);
          this.loadingBoardStatuses$.next(false);
        }

        throw error;
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult> {

    return this._Request<BoardTaskDeleteResult>(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = User.storeRef(this._inMemory, this._userId);
      const userSnap = await userRef.get();
      const user = User.storeData(userSnap);
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId: string) => boardId === data.boardId), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const boardRef = Board.storeRef(this._inMemory, data.boardId);
      const boardSnap = await boardRef.get();
      const board = Board.storeData(boardSnap);

      const boardTaskRef = BoardTask.storeRef(boardSnap.reference, data.id);
      const boardTaskSnap = await boardTaskRef.get();
      InMemoryError.testRequirement(!boardTaskSnap.exists, {code: 'not-found', message: 'Board task not found'});
      const boardTask = BoardTask.storeData(boardTaskSnap);

      const boardStatusId = boardTask.boardStatusId;
      const boardStatusRef = BoardStatus.storeRef(boardSnap.reference, boardStatusId);
      const boardStatusSnap = await boardStatusRef.get();
      const boardStatus = BoardStatus.storeData(boardStatusSnap);

      writeBatch.update(boardStatusSnap.reference, {
        boardTasksIds: boardStatus.boardTasksIds.toSet().difference([boardTaskSnap.id].toSet()).toArray()
      });

      writeBatch.delete(boardTaskSnap.reference);

      const boardSubtasksRefs = BoardTaskSubtask.storeRefsFromBoardTask(boardTaskSnap.reference, boardTask);
      const boardSubtasksSnapsPromise: Promise<DocumentSnapshot>[] = [];

      for (const boardSubtasksRef of boardSubtasksRefs) {
        boardSubtasksSnapsPromise.push(boardSubtasksRef.get());
      }

      const boardSubtasksSnaps = await Promise.all(boardSubtasksSnapsPromise);

      for (const boardSubtasksSnap of boardSubtasksSnaps) {
        writeBatch.delete(boardSubtasksSnap.reference);
      }

      writeBatch.update(boardSnap.reference, {
        boardTasksIds: board.boardTasksIds.toSet().difference([boardTaskSnap.id].toSet()).toArray()
      });

      await writeBatch.commit();

    }).pipe(
      tap(() => {

        this._snackBarService.open('Board task has been deleted', 3000);

        if (this.boardId$.value) {
          this.loadingBoardTasks$.next(true);
          this.loadingBoardStatuses$.next(true);
        }
      }),
      catchError((error) => {

        if (this.boardId$.value) {
          this.loadingBoardTasks$.next(false);
          this.loadingBoardStatuses$.next(false);
        }

        throw error;
      })
    );
  }

  boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult> {

    return this._Request(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = User.storeRef(this._inMemory, this._userId);
      const userSnap = await userRef.get();
      const user = User.storeData(userSnap);
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId: string) => boardId === data.boardId), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const boardRef = Board.storeRef(this._inMemory, data.boardId);
      const boardSnap = await boardRef.get();

      const boardStatusRef = BoardStatus.storeRef(boardSnap.reference, data.boardStatus.id);
      const boardStatusSnap = await boardStatusRef.get();
      InMemoryError.testRequirement(!boardStatusSnap.exists, {code: 'not-found', message: 'Board status not found'});
      const boardStatus = BoardStatus.storeData(boardStatusSnap);

      const taskRef = BoardTask.storeRef(boardSnap.reference, data.id);
      const taskSnap = await taskRef.get();
      InMemoryError.testRequirement(!taskSnap.exists, {code: 'not-found', message: 'Board task not found'});
      const boardTask = BoardTask.storeData(taskSnap);

      let newBoardStatusSnap;
      if (data.boardStatus.newId) {

        writeBatch.update(boardStatusSnap.reference, {
          boardTasksIds: boardStatus.boardTasksIds.filter((boardTaskId) => boardTaskId !== data.id)
        });

        const newBoardStatusRef = BoardStatus.storeRef(boardSnap.reference, data.boardStatus.newId);
        newBoardStatusSnap = await newBoardStatusRef.get();
        InMemoryError.testRequirement(!newBoardStatusSnap.exists, {
          code: 'not-found',
          message: 'New board status not found'
        });
        const newBoardStatus = BoardStatus.storeData(newBoardStatusSnap);

        writeBatch.update(newBoardStatusSnap.reference, {
          boardTasksIds: [data.id, ...newBoardStatus.boardTasksIds]
        });
      }

      const currentBoardTaskSubtasksIds = boardTask.boardTaskSubtasksIds || [];
      const newBoardTaskSubtasksIds = data.boardTaskSubtasks.filter((s) => s.id).map((s) => s.id) as string[];

      const boardTaskSubtasksIdsToRemove = currentBoardTaskSubtasksIds.toSet().difference(newBoardTaskSubtasksIds.toSet());

      const boardTaskSubtasksRefsToRemove = [];

      for (const boardTaskSubtaskIdToRemove of boardTaskSubtasksIdsToRemove) {
        boardTaskSubtasksRefsToRemove.push(BoardTaskSubtask.storeRef(taskSnap.reference, boardTaskSubtaskIdToRemove));
      }

      const boardTaskSubtasksSnapsToRemovePromise: Promise<DocumentSnapshot>[] = [];

      for (const boardTaskSubtasksRefToRemove of boardTaskSubtasksRefsToRemove) {
        boardTaskSubtasksSnapsToRemovePromise.push(boardTaskSubtasksRefToRemove.get());
      }

      const boardTaskSubtasksSnapsToRemove = await Promise.all(boardTaskSubtasksSnapsToRemovePromise);

      for (const boardTaskSubtasksSnapToRemove of boardTaskSubtasksSnapsToRemove) {
        writeBatch.delete(boardTaskSubtasksSnapToRemove.reference);
      }

      const boardTaskSubtasksRefs = [];

      for (let i = 0; i < data.boardTaskSubtasks.length; ++i) {
        const boardTaskSubtaskId = data.boardTaskSubtasks[i].id;
        const boardTaskSubtaskRef = BoardTaskSubtask.storeRef(taskSnap.reference, boardTaskSubtaskId);
        boardTaskSubtasksRefs.push(boardTaskSubtaskRef);
      }

      const boardTaskSubtasksSnapsPromise: Promise<DocumentSnapshot>[] = [];

      for (const boardTaskSubtasksRef of boardTaskSubtasksRefs) {
        boardTaskSubtasksSnapsPromise.push(boardTaskSubtasksRef.get());
      }

      const boardTaskSubtasksSnaps = await Promise.all(boardTaskSubtasksSnapsPromise);
      const boardTaskSubtasksIds = [];

      for (const [i, boardTaskSubtaskSnap] of boardTaskSubtasksSnaps.entries()) {

        if (!boardTaskSubtaskSnap.exists) {
          const boardTaskSubtask = {
            title: data.boardTaskSubtasks[i].title,
            isCompleted: false
          };

          writeBatch.create(boardTaskSubtaskSnap.reference, boardTaskSubtask);
        } else {
          writeBatch.update(boardTaskSubtaskSnap.reference, {
            title: data.boardTaskSubtasks[i].title
          });
        }

        boardTaskSubtasksIds.push(boardTaskSubtaskSnap.id);
      }

      InMemoryError.testRequirement(boardTaskSubtasksIds.length > this._kanbanConfig.maxBoardTaskSubtasks, {
        code: 'resource-exhausted',
        message: `Board task can have ${this._kanbanConfig.maxBoardTaskSubtasks} subtasks`
      });

      writeBatch.update(taskSnap.reference, {
        title: data.title,
        description: data.description,
        boardTaskSubtasksIds,
        boardStatusId: newBoardStatusSnap ? newBoardStatusSnap.id : boardTask.boardStatusId
      });

      await writeBatch.commit();

      return {
        boardTaskSubtasksIds
      };

    }).pipe(
      tap(() => {

        this._snackBarService.open('Board task has been updated', 3000);

        if (this.boardId$.value) {
          this.loadingBoardTasks$.next(true);
          this.loadingBoardStatuses$.next(true);
        }

      }),
      catchError((error) => {

        if (this.boardId$.value) {
          this.loadingBoardTasks$.next(false);
          this.loadingBoardStatuses$.next(false);
        }

        throw error;
      })
    );
  }

  updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardId: string, boardTaskId: string, boardTaskSubtaskId: string) {

    return this._Request(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const boardTaskRef = Board.storeRef(this._inMemory, boardId).collection(Collections.boardTasks).doc(boardTaskId);
      const boardTaskSnap = await boardTaskRef.get();
      const boardTask = BoardTask.storeData(boardTaskSnap);

      const boardTaskSubtaskRef = boardTaskRef.collection(Collections.boardTaskSubtasks).doc(boardTaskSubtaskId);
      const boardTaskSubtaskSnap = await boardTaskSubtaskRef.get();
      const boardTaskSubtask = BoardTaskSubtask.storeData(boardTaskSubtaskSnap);

      if (boardTaskSubtask.isCompleted === isCompleted) {
        return Promise.resolve();
      }

      writeBatch.update(boardTaskSubtaskSnap.reference, {
        isCompleted
      });

      writeBatch.update(boardTaskSnap.reference, {
        completedBoardTaskSubtasks: boardTask.completedBoardTaskSubtasks + (!isCompleted ? -1 : 1)
      });

      return writeBatch.commit().then(() => {
      });
    });
  }

  loadDefault() {
    // this._inMemoryStore$.next({
    //   users: defaultInMemoryUsers,
    //   boards: defaultInMemoryBoards,
    // });
  }
}
