import {Injectable} from '@angular/core';
import {Firestore, limit} from '@angular/fire/firestore';
import {catchError, combineLatest, map, of, shareReplay, switchMap, tap} from 'rxjs';
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
import {BoardTaskSubtask} from '../../models/board-task-subtask';
import {Config} from '../../models/config';
import {User} from '../../models/user';
import {UserBoard} from '../../models/user-board';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {tapOnce} from '../../utils/tap-once.rxjs-pipe';
import {tapTimeoutRxjsPipe} from '../../utils/tap-timeout.rxjs-pipe';
import {AuthService} from '../auth/auth.service';
import {collectionSnapshots, docSnapshots, updateDoc} from '../firebase/firestore';
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
      this.firstLoadingUserBoards$.next(true);
      this.firstLoadingBoard$.next(true);
      this.firstLoadingBoardStatuses$.next(true);
      this.firstLoadingBoardTasks$.next(true);
      this.firstLoadingBoardTask$.next(true);
      this.firstLoadingBoardTaskSubtasks$.next(true);
    }),
    shareReplay()
  );

  override config$ = docSnapshots(Config.firestoreRef(this._firestore, 'global')).pipe(
    map(Config.firestoreData),
    catchError(() => of(null)),
    getProtectedRxjsPipe(),
    shareReplay()
  );

  override userBoards$ = combineLatest([
    this.user$,
    this.config$
  ]).pipe(
    tap(() => this.loadingUserBoards$.next(true)),
    switchMap(([user, config]) => {

      if (user === null || config === null) {
        return of(null);
      }

      if (user === undefined || config === undefined) {
        return of(undefined);
      }

      const userBoardCollectionRef = UserBoard.firestoreCollectionRef(User.firestoreRef(this._firestore, user.id));

      return collectionSnapshots(userBoardCollectionRef, limit(config.maxUserBoards)).pipe(
        map((querySnapUserBoard) => {

          const querySnapUserBoardMap = new Map<string, UserBoard>();

          for (const queryDocSnapUserBoard of querySnapUserBoard.docs) {
            querySnapUserBoardMap.set(queryDocSnapUserBoard.id, UserBoard.firestoreData(queryDocSnapUserBoard));
          }

          return user.boardsIds.map((boardId) => {
            return querySnapUserBoardMap.get(boardId);
          }).filter((userBoard) => !!userBoard) as UserBoard[];
        })
      );
    }),
    catchError(() => of(null)),
    tapTimeoutRxjsPipe(() => {
      this.loadingUserBoards$.next(false);
      this.firstLoadingUserBoards$.next(false);
    }),
    getProtectedRxjsPipe(),
    shareReplay()
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

      const boardRef = Board.firestoreRef(this._firestore, boardId);
      return docSnapshots(boardRef).pipe(
        map((boardSnap) => {

          if (!boardSnap.exists()) {
            return null;
          }

          return Board.firestoreData(boardSnap);
        })
      );
    }),
    catchError(() => of(null)),
    tapTimeoutRxjsPipe(() => {
      this.loadingBoard$.next(false);
      this.firstLoadingBoard$.next(false);
    }),
    getProtectedRxjsPipe(),
    shareReplay()
  );

  override boardStatuses$ = combineLatest([
    this.board$,
    this.user$,
    this.config$
  ]).pipe(
    tap(() => this.loadingBoardStatuses$.next(true)),
    switchMap(([board, user, config]) => {

      if (board === null || user === null || config === null) {
        return of(null);
      }

      if (board === undefined || user === undefined || config === undefined) {
        return of(undefined);
      }

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardStatusesRef = BoardStatus.firestoreCollectionRef(boardRef);

      return collectionSnapshots(boardStatusesRef, limit(config.maxBoardStatuses)).pipe(
        map((querySnapBoardStatuses) => {

          const boardStatuses: { [key in string]: BoardStatus } = {};

          for (const querySnapDocBoardStatus of querySnapBoardStatuses.docs) {
            Object.assign(boardStatuses, {[querySnapDocBoardStatus.id]: BoardStatus.firestoreData(querySnapDocBoardStatus)});
          }

          return boardStatuses;
        })
      );
    }),
    catchError(() => of(null)),
    tapTimeoutRxjsPipe(() => {
      this.loadingBoardStatuses$.next(false);
      this.firstLoadingBoardStatuses$.next(false);
    }),
    getProtectedRxjsPipe(),
    shareReplay()
  );

  override boardTasks$ = combineLatest([
    this.board$,
    this.user$,
    this.config$
  ]).pipe(
    tap(() => this.loadingBoardTasks$.next(true)),
    switchMap(([board, user, config]) => {

      if (board === null || user === null || config === null) {
        return of(null);
      }

      if (board === undefined || user === undefined || config === undefined) {
        return of(undefined);
      }

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTasksRef = BoardTask.firestoreCollectionRef(boardRef);

      return collectionSnapshots(boardTasksRef, limit(config.maxBoardTasks)).pipe(
        map((querySnapBoardTasks) => {

          const boardTasks: { [key in string]: BoardTask } = {};

          for (const querySnapDocBoardTask of querySnapBoardTasks.docs) {
            Object.assign(boardTasks, {[querySnapDocBoardTask.id]: BoardTask.firestoreData(querySnapDocBoardTask)});
          }

          return boardTasks;
        })
      );
    }),
    catchError(() => of(null)),
    tapTimeoutRxjsPipe(() => {
      this.loadingBoardTasks$.next(false);
      this.firstLoadingBoardTasks$.next(false);
    }),
    getProtectedRxjsPipe(),
    shareReplay()
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
    getProtectedRxjsPipe(),
    shareReplay()
  );

  override boardTaskSubtasks$ = combineLatest([
    this.board$,
    this.boardTask$,
    this.config$
  ]).pipe(
    tap(() => this.loadingBoardTask$.next(true)),
    switchMap(([board, boardTask, config]) => {

      if (board === null || boardTask === null || config === null) {
        return of(null);
      }

      if (board === undefined || boardTask === undefined || config === undefined) {
        return of(undefined);
      }

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTaskRef = BoardTask.firestoreRef(boardRef, boardTask.id);
      const boardTaskSubtasksRef = BoardTaskSubtask.firestoreRefs(boardTaskRef);

      return collectionSnapshots(boardTaskSubtasksRef, limit(config.maxBoardTaskSubtasks)).pipe(
        map((querySnapBoardTaskSubtasks) => {

          const boardTaskSubtasks: { [key in string]: BoardTaskSubtask } = {};

          for (const queryDocSnapBoardTaskSubtask of querySnapBoardTaskSubtasks.docs) {
            Object.assign(boardTaskSubtasks, {[queryDocSnapBoardTaskSubtask.id]: BoardTaskSubtask.firestoreData(queryDocSnapBoardTaskSubtask)});
          }

          return boardTaskSubtasks;
        }),
      );
    }),
    catchError(() => of(null)),
    tapTimeoutRxjsPipe(() => {
      this.loadingBoardTask$.next(false);
      this.firstLoadingBoardTask$.next(false);
    }),
    getProtectedRxjsPipe(),
    shareReplay()
  );

  constructor(
    private readonly _authService: AuthService,
    private readonly _firestore: Firestore,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {
    super();
  }

  boardCreate(data: BoardCreateData) {

    return this._functionsService.httpsCallable<BoardCreateData, BoardCreateResult>('board-create', data).pipe(
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

    return this._functionsService.httpsCallable<BoardDeleteData, BoardDeleteResult>('board-delete', data).pipe(
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

    return this._functionsService.httpsCallable<BoardUpdateData, BoardUpdateResult>('board-update', data).pipe(
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

    return this._functionsService.httpsCallable<BoardTaskCreateData, BoardTaskCreateResult>('board-task-create', data).pipe(
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

  boardTaskDelete(data: BoardTaskDeleteData) {

    return this._functionsService.httpsCallable<BoardTaskDeleteData, BoardTaskDeleteResult>('board-task-delete', data).pipe(
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

  boardTaskUpdate(data: BoardTaskUpdateData) {

    return this._functionsService.httpsCallable<BoardTaskUpdateData, BoardTaskUpdateResult>('board-task-update', data).pipe(
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

    const boardRef = Board.firestoreRef(this._firestore, boardId);
    const boardTaskRef = BoardTask.firestoreRef(boardRef, boardTaskId);
    const boardTaskSubtaskRef = BoardTaskSubtask.firestoreRef(boardTaskRef, boardTaskSubtaskId);

    return updateDoc(boardTaskSubtaskRef, {isCompleted});
  }
}
