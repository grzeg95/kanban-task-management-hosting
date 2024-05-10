import {Inject, Injectable} from '@angular/core';
import {Firestore, limit} from '@angular/fire/firestore';
import {BehaviorSubject, combineLatest, map, of, share, shareReplay, switchMap, tap} from 'rxjs';
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
  BoardTaskUpdateResult
} from '../../models/board-task';
import {BoardTaskSubtask} from '../../models/board-task-subtask';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {AuthService} from '../auth/auth.service';
import {User} from '../auth/models/user';
import {UserBoard} from '../auth/models/user-board';
import {collectionSnapshots, docSnapshots, updateDoc} from '../firebase/firestore';
import {FunctionsService} from '../firebase/functions.service';
import {SnackBarService} from '../snack-bar.service';
import {BoardServiceAbstract} from './board-service.abstract';

@Injectable({
  providedIn: 'root'
})
export class FirebaseBoardService extends BoardServiceAbstract {

  override user$ = this._authService.user$.pipe(
    // getProtectedRxjsPipe(),
    tap((user) => console.log({user}))
  );

  override loadingUser$ = this.user$.pipe(map((user) => user === undefined));

  override userBoards$ = this.user$.pipe(
    switchMap((user) => {

      if (user === null) {
        return of(null);
      }

      if (user === undefined) {
        return of(undefined);
      }

      const userBoardCollectionRef = UserBoard.firestoreCollectionRef(User.firestoreRef(this._firestore, user.id));

      return collectionSnapshots(userBoardCollectionRef, limit(this._kanbanConfig.maxUserBoards)).pipe(
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
    // getProtectedRxjsPipe(),
    tap((userBoards) => console.log({userBoards}))
  );

  override loadingUserBoards$ = this.userBoards$.pipe(map((userBoards) => userBoards === undefined));

  override board$ = combineLatest([
    this.boardId$/*.pipe(getProtectedRxjsPipe())*/,
    this.user$
  ]).pipe(
    switchMap(([boardId, user]) => {

      if (boardId === null || user === null) {
        return of(null);
      }

      if (user === undefined) {
        return of(undefined);
      }

      if (boardId === undefined) {
        return of(null);
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
    // getProtectedRxjsPipe(),
    tap((board) => console.log({board}))
  );

  override loadingBoard$ = this.board$.pipe(map((board) => board === undefined));

  override boardStatuses$ = combineLatest([
    this.board$,
    this.user$
  ]).pipe(
    switchMap(([board, user]) => {

      if (board === null || user === null) {
        return of(null);
      }

      if (board === undefined || user === undefined) {
        return of(undefined);
      }

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardStatusesRef = BoardStatus.firestoreCollectionRef(boardRef);

      return collectionSnapshots(boardStatusesRef, limit(this._kanbanConfig.maxBoardStatuses)).pipe(
        map((querySnapBoardStatuses) => {

          const boardStatuses: { [key in string]: BoardStatus } = {};

          for (const querySnapDocBoardStatus of querySnapBoardStatuses.docs) {
            Object.assign(boardStatuses, {[querySnapDocBoardStatus.id]: BoardStatus.firestoreData(querySnapDocBoardStatus)});
          }

          return boardStatuses;
        })
      );
    }),
    // getProtectedRxjsPipe(),
    tap((boardStatuses) => console.log({boardStatuses}))
  );

  override loadingBoardStatuses$ = this.boardStatuses$.pipe(map((boardStatuses) => boardStatuses === undefined));

  override boardTasks$ = combineLatest([
    this.board$,
    this.user$
  ]).pipe(
    switchMap(([board, user]) => {

      if (board === null || user === null) {
        return of(null);
      }

      if (board === undefined || user === undefined) {
        return of(undefined);
      }

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTasksRef = BoardTask.firestoreCollectionRef(boardRef);

      return collectionSnapshots(boardTasksRef, limit(this._kanbanConfig.maxBoardTasks)).pipe(
        map((querySnapBoardTasks) => {

          const boardTasks: { [key in string]: BoardTask } = {};

          for (const querySnapDocBoardTask of querySnapBoardTasks.docs) {
            Object.assign(boardTasks, {[querySnapDocBoardTask.id]: BoardTask.firestoreData(querySnapDocBoardTask)});
          }

          return boardTasks;
        })
      );
    }),
    // getProtectedRxjsPipe(),
    tap((boardTasks) => console.log({boardTasks}))
  );

  override loadingBoardTasks$ = this.boardTasks$.pipe(map((boardTasks) => boardTasks === undefined));

  override boardTask$ = combineLatest([
    this.boardTasks$,
    this.boardTaskId$/*.pipe(getProtectedRxjsPipe())*/,
  ]).pipe(
    map(([boardTasks, boardTaskId]) => {

      if (boardTasks === null || boardTaskId === null) {
        return null;
      }

      if (boardTasks === undefined || boardTaskId === undefined) {
        return undefined;
      }

      return boardTasks[boardTaskId] || null;
    }),
    tap((boardTask) => console.log({boardTask}))
  );

  override loadingBoardTask$ = this.boardTask$.pipe(map((boardTask) => boardTask === undefined));

  override boardTaskSubtasks$ = combineLatest([
    this.board$,
    this.boardTask$,
  ]).pipe(
    switchMap(([board, boardTask]) => {

      if (board === null || boardTask === null) {
        return of(null);
      }

      if (board === undefined || boardTask === undefined) {
        return of(undefined);
      }

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTaskRef = BoardTask.firestoreRef(boardRef, boardTask.id);
      const boardTaskSubtasksRef = BoardTaskSubtask.firestoreRefs(boardTaskRef);

      return collectionSnapshots(boardTaskSubtasksRef, limit(this._kanbanConfig.maxBoardTaskSubtasks)).pipe(
        map((querySnapBoardTaskSubtasks) => {

          const boardTaskSubtasks: { [key in string]: BoardTaskSubtask } = {};

          for (const queryDocSnapBoardTaskSubtask of querySnapBoardTaskSubtasks.docs) {
            Object.assign(boardTaskSubtasks, {[queryDocSnapBoardTaskSubtask.id]: BoardTaskSubtask.firestoreData(queryDocSnapBoardTaskSubtask)});
          }

          return boardTaskSubtasks;
        }),
      );
    }),
    // getProtectedRxjsPipe(),
    tap((boardTaskSubtasks) => console.log({boardTaskSubtasks}))
  );

  override loadingBoardTaskSubtasks$ = this.boardTaskSubtasks$.pipe(map((boardTaskSubtasks) => boardTaskSubtasks === undefined));

  constructor(
    private readonly _authService: AuthService,
    private readonly _firestore: Firestore,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService,
    @Inject(KanbanConfig) private readonly _kanbanConfig: KanbanConfig
  ) {
    super();
  }

  boardCreate(data: BoardCreateData) {

    return this._functionsService.httpsCallable<BoardCreateData, BoardCreateResult>('board-create', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been created', 3000);
      })
    );
  }

  boardDelete(data: BoardDeleteData) {

    return this._functionsService.httpsCallable<BoardDeleteData, BoardDeleteResult>('board-delete', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been deleted', 3000);
      })
    );
  }

  boardUpdate(data: BoardUpdateData) {

    return this._functionsService.httpsCallable<BoardUpdateData, BoardUpdateResult>('board-update', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been updated', 3000);
      })
    );
  }

  boardTaskCreate(data: BoardTaskCreateData) {

    return this._functionsService.httpsCallable<BoardTaskCreateData, BoardTaskCreateResult>('board-task-create', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been created', 3000);
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData) {

    return this._functionsService.httpsCallable<BoardTaskDeleteData, BoardTaskDeleteResult>('board-task-delete', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been deleted', 3000);
      })
    );
  }

  boardTaskUpdate(data: BoardTaskUpdateData) {

    return this._functionsService.httpsCallable<BoardTaskUpdateData, BoardTaskUpdateResult>('board-task-update', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been updated', 3000);
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
