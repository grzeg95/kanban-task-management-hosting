import {Inject, Injectable} from '@angular/core';
import {Firestore, limit, updateDoc} from 'firebase/firestore';
import isEqual from 'lodash/isEqual';
import {
  catchError,
  combineLatest,
  defer,
  distinctUntilChanged,
  filter,
  map,
  of,
  shareReplay,
  switchMap,
  tap
} from 'rxjs';
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
  BoardTaskUpdateResult
} from '../../models/board-task';
import {BoardTaskSubtask, BoardTaskSubtaskDoc} from '../../models/board-task-subtask';
import {Config} from '../../models/config';
import {User} from '../../models/user';
import {UserBoard} from '../../models/user-board';
import {FirestoreInjectionToken} from '../../tokens/firebase';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {tapOnce} from '../../utils/tap-once.rxjs-pipe';
import {AuthService} from '../auth/auth.service';
import {collectionSnapshots, docSnapshots} from '../firebase/firestore';
import {FunctionsService} from '../firebase/functions.service';
import {SnackBarService} from '../snack-bar.service';
import {BoardServiceAbstract} from './board-service.abstract';

@Injectable({
  providedIn: 'root'
})
export class FirebaseBoardService extends BoardServiceAbstract {

  override user$ = this._authService.user$.pipe(
    getProtectedRxjsPipe(),
    tapOnce(() => {
      this.firstLoadingUserBoardsUpdate(true);
      this.firstLoadingBoardUpdate(true);
      this.firstLoadingBoardStatusesUpdate(true);
      this.firstLoadingBoardTasksUpdate(true);
      this.firstLoadingBoardTaskUpdate(true);
      this.firstLoadingBoardTaskSubtasksUpdate(true);
    }),
    shareReplay()
  );

  override config$ = docSnapshots(Config.firestoreRef(this._firestore, 'global')).pipe(
    map((docSnap) => Config.firestoreData(docSnap)),
    catchError(() => of(null)),
    getProtectedRxjsPipe(),
    shareReplay()
  );

  override userBoards$ = this.config$.pipe(
    filter((config): config is Config => !!config),
    distinctUntilChanged((a, b) => isEqual(a.maxUserBoards, b.maxUserBoards))
  ).pipe(
    tap(() => this.loadingUserBoardsUpdate(true)),
    switchMap((config) => {

      return this.user$.pipe(
        filter((user): user is User => !!user),
        distinctUntilChanged((a, b) => isEqual(a.id, b.id)),
        switchMap((user) => {

          const userBoardCollectionRef = UserBoard.firestoreCollectionRef(User.firestoreRef(this._firestore, user.id));

          return collectionSnapshots(userBoardCollectionRef, limit(config.maxUserBoards)).pipe(
            map((querySnapUserBoards) => querySnapUserBoards.docs)
          );
        }),

        switchMap((queryDocSnapsUserBoard) => {

          return this.user$.pipe(
            filter((user): user is User => !!user),
            distinctUntilChanged((a, b) => isEqual(a.boardsIds, b.boardsIds)),
            map((user) => user.boardsIds),
            map((userBoardsIds) => {

              const querySnapUserBoardsMap = new Map<string, UserBoard>();

              for (const queryDocSnapUserBoard of queryDocSnapsUserBoard) {
                querySnapUserBoardsMap.set(queryDocSnapUserBoard.id, UserBoard.firestoreData(queryDocSnapUserBoard));
              }

              return userBoardsIds
                .map((boardId) => querySnapUserBoardsMap.get(boardId))
                .filter((userBoard) => !!userBoard) as UserBoard[];

            }),
            catchError(() => of(null)),
            tap(() => {
              this.loadingUserBoardsUpdate(false);
              this.firstLoadingUserBoardsUpdate(false);
            })
          )
        }),
        getProtectedRxjsPipe(),
        shareReplay()
      );
    })
  );

  override board$ = this.boardId$.pipe(
    filter((boardId): boardId is string => !!boardId),
    distinctUntilChanged((a, b) => isEqual(a, b)),
    getProtectedRxjsPipe(),
    tap(() => {
      this.firstLoadingBoardUpdate(true);
      this.firstLoadingBoardStatusesUpdate(true);
      this.firstLoadingBoardTasksUpdate(true);
    })
  ).pipe(
    tap(() => this.loadingBoardUpdate(true)),
    switchMap((boardId) => {

      const boardRef = Board.firestoreRef(this._firestore, boardId);
      return docSnapshots(boardRef).pipe(
        map((boardSnap) => {

          if (!boardSnap.exists()) {
            return null;
          }

          return Board.firestoreData(boardSnap);
        }),
        catchError(() => of(null)),
        tap(() => {
          this.loadingBoardUpdate(false);
          this.firstLoadingBoardUpdate(false);
        })
      );
    }),
    getProtectedRxjsPipe(),
    shareReplay()
  );

  override boardStatuses$ = combineLatest([
    this.board$.pipe(
      filter((board): board is Board => !!board),
      distinctUntilChanged((a, b) => isEqual(a.id, b.id))
    ),
    this.config$.pipe(
      filter((config): config is Config => !!config),
      distinctUntilChanged((a, b) => isEqual(a.maxBoardStatuses, b.maxBoardStatuses))
    ),
  ]).pipe(
    tap(() => this.loadingBoardStatusesUpdate(true)),
    switchMap(([board, config]) => {

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardStatusesRef = BoardStatus.firestoreCollectionRef(boardRef);

      return collectionSnapshots(boardStatusesRef, limit(config.maxBoardStatuses)).pipe(
        map((querySnapBoardStatuses) => {

          const querySnapBoardStatusesMap = new Map<string, BoardStatus>();

          for (const queryDocSnapBoardStatus of querySnapBoardStatuses.docs) {
            querySnapBoardStatusesMap.set(queryDocSnapBoardStatus.id, BoardStatus.firestoreData(queryDocSnapBoardStatus));
          }

          return querySnapBoardStatusesMap;
        }),
        catchError(() => of(null)),
        tap(() => {
          this.loadingBoardStatusesUpdate(false);
          this.firstLoadingBoardStatusesUpdate(false);
        })
      );
    }),
    getProtectedRxjsPipe(),
    shareReplay()
  );

  override boardTasks$ = combineLatest([
    this.board$.pipe(
      filter((board): board is Board => !!board),
      distinctUntilChanged((a, b) => isEqual(a.id, b.id))
    ),
    this.config$.pipe(
      filter((config): config is Config => !!config),
      distinctUntilChanged((a, b) => isEqual(a.maxBoardTasks, b.maxBoardTasks))
    ),
  ]).pipe(
    tap(() => this.loadingBoardTasksUpdate(true)),
    switchMap(([board, config]) => {

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTasksRef = BoardTask.firestoreCollectionRef(boardRef);

      return collectionSnapshots(boardTasksRef, limit(config.maxBoardTasks)).pipe(
        map((querySnapBoardTasks) => {

          const querySnapUserBoardTasksMap = new Map<string, BoardTask>();

          for (const queryDocSnapBoardTask of querySnapBoardTasks.docs) {
            querySnapUserBoardTasksMap.set(queryDocSnapBoardTask.id, BoardTask.firestoreData(queryDocSnapBoardTask));
          }

          return querySnapUserBoardTasksMap;
        }),
        catchError(() => of(null)),
        tap(() => {
          this.loadingBoardTasksUpdate(false);
          this.firstLoadingBoardTasksUpdate(false);
        }),
      );
    }),
    getProtectedRxjsPipe(),
    shareReplay()
  );

  override boardTask$ = combineLatest([
    this.boardTasks$.pipe(
      filter((boardTasks): boardTasks is Map<string, BoardTask> => !!boardTasks),
      distinctUntilChanged((a, b) => isEqual(a, b))
    ),
    this.boardTaskId$.pipe(
      filter((boardTaskId): boardTaskId is string => !!boardTaskId),
      tap(() => {
        this.firstLoadingBoardTaskUpdate(true);
        this.firstLoadingBoardTaskSubtasksUpdate(true);
      })
    )
  ]).pipe(
    tap(() => this.loadingBoardTaskUpdate(true)),
    map(([boardTasks, boardTaskId]) => {
      return boardTasks.get(boardTaskId) || null;
    }),
    tap(() => {
      this.loadingBoardTaskUpdate(false);
      this.firstLoadingBoardTaskUpdate(false);
    }),
    getProtectedRxjsPipe(),
    shareReplay()
  );

  override boardTaskSubtasks$ = combineLatest([
    this.board$.pipe(
      filter((board): board is Board => !!board),
      distinctUntilChanged((a, b) => isEqual(a.id, b.id))
    ),
    this.boardTask$.pipe(
      filter((boardTask): boardTask is BoardTask => !!boardTask),
      distinctUntilChanged((a, b) => isEqual(a, b))
    ),
    this.config$.pipe(
      filter((config): config is Config => !!config),
      distinctUntilChanged((a, b) => isEqual(a.maxBoardTaskSubtasks, b.maxBoardTaskSubtasks))
    ),
  ]).pipe(
    tap(() => this.loadingBoardTaskUpdate(true)),
    switchMap(([board, boardTask, config]) => {

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTaskRef = BoardTask.firestoreRef(boardRef, boardTask.id);
      const boardTaskSubtasksRef = BoardTaskSubtask.firestoreRefs(boardTaskRef);

      return collectionSnapshots<BoardTaskSubtask, BoardTaskSubtaskDoc>(boardTaskSubtasksRef, limit(config.maxBoardTaskSubtasks)).pipe(
        map((querySnapBoardTaskSubtasks) => {

          const querySnapUserBoardTaskSubtasksMap = new Map<string, BoardTaskSubtask>();

          for (const queryDocSnapBoardTaskSubtask of querySnapBoardTaskSubtasks.docs) {
            querySnapUserBoardTaskSubtasksMap.set(queryDocSnapBoardTaskSubtask.id, BoardTaskSubtask.firestoreData(queryDocSnapBoardTaskSubtask));
          }

          return querySnapUserBoardTaskSubtasksMap;
        }),
        catchError(() => of(null)),
        tap(() => {
          this.loadingBoardTaskUpdate(false);
          this.firstLoadingBoardTaskUpdate(false);
        })
      );
    }),
    getProtectedRxjsPipe(),
    shareReplay()
  );

  constructor(
    private readonly _authService: AuthService,
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {
    super();
  }

  boardCreate(data: BoardCreateData) {

    return this._functionsService.httpsCallable<BoardCreateData, BoardCreateResult>('board-create', data).pipe(
      tap(() => {

        this._snackBarService.open('Board has been created', 3000);

        this.loadingUserBoardsUpdate(true);

        if (this.boardId$.value) {
          this.loadingBoardUpdate(true);
        }
      }),
      catchError((error) => {

        this.loadingUserBoardsUpdate(false);

        if (this.boardId$.value) {
          this.loadingBoardUpdate(false);
        }

        throw error;
      })
    );
  }

  boardDelete(data: BoardDeleteData) {

    return this._functionsService.httpsCallable<BoardDeleteData, BoardDeleteResult>('board-delete', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been deleted', 3000);
        this.loadingUserBoardsUpdate(true);
      }),
      catchError((error) => {
        this.loadingUserBoardsUpdate(false);
        throw error;
      })
    );
  }

  boardUpdate(data: BoardUpdateData, boardNameWasChanged: boolean, boardStatusNameWasChanged: boolean, boardStatusAddedOrDeleted: boolean) {

    return this._functionsService.httpsCallable<BoardUpdateData, BoardUpdateResult>('board-update', data).pipe(
      tap(() => {

        this._snackBarService.open('Board has been updated', 3000);

        if (this.boardId$.value) {
          if (boardNameWasChanged) {
            this.loadingBoardUpdate(true);
            this.loadingUserBoardsUpdate(true);
          }

          if (boardStatusNameWasChanged || boardStatusAddedOrDeleted) {
            this.loadingBoardStatusesUpdate(true);
          }

          if (boardStatusAddedOrDeleted) {
            this.loadingBoardTasksUpdate(true);
          }
        }
      }),
      catchError((error) => {

        if (this.boardId$.value) {
          if (boardNameWasChanged) {
            this.loadingBoardUpdate(false);
            this.loadingUserBoardsUpdate(false);
          }

          if (boardStatusNameWasChanged || boardStatusAddedOrDeleted) {
            this.loadingBoardStatusesUpdate(false);
          }

          if (boardStatusAddedOrDeleted) {
            this.loadingBoardTasksUpdate(false);
          }
        }

        throw error;
      })
    );
  }

  boardTaskCreate(data: BoardTaskCreateData) {

    return this._functionsService.httpsCallable<BoardTaskCreateData, BoardTaskCreateResult>('board-task-create', data).pipe(
      tap(() => {

        this._snackBarService.open('Board task has been created', 3000);

        if (this.boardId$.value) {
          this.loadingBoardTasksUpdate(true);
          this.loadingBoardStatusesUpdate(true);
        }
      }),
      catchError((error) => {

        if (this.boardId$.value) {
          this.loadingBoardTasksUpdate(false);
          this.loadingBoardStatusesUpdate(false);
        }

        throw error;
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData) {

    return this._functionsService.httpsCallable<BoardTaskDeleteData, BoardTaskDeleteResult>('board-task-delete', data).pipe(
      tap(() => {

        this._snackBarService.open('Board task has been deleted', 3000);

        if (this.boardId$.value) {
          this.loadingBoardTasksUpdate(true);
          this.loadingBoardStatusesUpdate(true);
        }
      }),
      catchError((error) => {

        if (this.boardId$.value) {
          this.loadingBoardTasksUpdate(false);
          this.loadingBoardStatusesUpdate(false);
        }

        throw error;
      })
    );
  }

  boardTaskUpdate(data: BoardTaskUpdateData) {

    return this._functionsService.httpsCallable<BoardTaskUpdateData, BoardTaskUpdateResult>('board-task-update', data).pipe(
      tap(() => {

        this._snackBarService.open('Board task has been updated', 3000);

        if (this.boardId$.value) {
          this.loadingBoardTasksUpdate(true);
          this.loadingBoardStatusesUpdate(true);
        }

      }),
      catchError((error) => {

        if (this.boardId$.value) {
          this.loadingBoardTasksUpdate(false);
          this.loadingBoardStatusesUpdate(false);
        }

        throw error;
      })
    );
  }

  updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardId: string, boardTaskId: string, boardTaskSubtaskId: string) {

    const boardRef = Board.firestoreRef(this._firestore, boardId);
    const boardTaskRef = BoardTask.firestoreRef(boardRef, boardTaskId);
    const boardTaskSubtaskRef = BoardTaskSubtask.firestoreRef(boardTaskRef, boardTaskSubtaskId);

    return defer(() => updateDoc(boardTaskSubtaskRef, {isCompleted}));
  }
}
