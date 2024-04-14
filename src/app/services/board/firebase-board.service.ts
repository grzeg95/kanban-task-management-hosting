import {Injectable} from '@angular/core';
import {Firestore, limit} from '@angular/fire/firestore';
import {BehaviorSubject, combineLatest, filter, map, of, switchMap, tap} from 'rxjs';
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
import {collectionOnSnapshot, docOnSnapshot, updateDoc} from '../firebase/firestore';
import {FunctionsService} from '../firebase/functions.service';
import {SnackBarService} from '../snack-bar.service';
import {BoardServiceAbstract} from './board-service.abstract';

@Injectable({
  providedIn: 'root'
})
export class FirebaseBoardService extends BoardServiceAbstract {

  override user$ = this._authService.user$.pipe(
    getProtectedRxjsPipe(),
    tap(() => this.resetSelectingUser())
  );

  override userBoards$ = this.user$.pipe(
    switchMap((user) => {

      if (user === null) {
        this.resetSelectingUserBoards();
        return of(null);
      }

      if (user === undefined) {
        return of(undefined);
      }

      const userBoardCollectionRef = UserBoard.collectionRef(User.ref(this._firestore, user.id));

      return collectionOnSnapshot(userBoardCollectionRef, limit(5)).pipe(
        map((querySnapUserBoard) => {

          const querySnapUserBoardMap = new Map<string, UserBoard>();

          for (const queryDocSnapUserBoard of querySnapUserBoard.docs) {
            querySnapUserBoardMap.set(queryDocSnapUserBoard.id, UserBoard.data(queryDocSnapUserBoard));
          }

          return user.boardsIds.map((boardId) => {
            return querySnapUserBoardMap.get(boardId);
          }).filter((userBoard) => !!userBoard) as UserBoard[];
        }),
        tap(() => this.resetSelectingUserBoards())
      );
    }),
    getProtectedRxjsPipe()
  );

  override board$ = combineLatest([
    this.boardId$.pipe(getProtectedRxjsPipe()),
    this.user$
  ]).pipe(
    switchMap(([boardId, user]) => {

      if (
        (!boardId && boardId === null) ||
        (!user && user === null)
      ) {
        this.resetSelectingBoard()
        return of(null);
      }

      if (boardId === undefined || user === undefined) {
        return of(undefined);
      }

      const boardRef = Board.ref(this._firestore, boardId);
      return docOnSnapshot(boardRef).pipe(
        map((boardSnap) => {

          if (!boardSnap.exists()) {
            return null;
          }

          return Board.data(boardSnap);
        }),
        tap(() => this.resetSelectingBoard())
      );
    }),
    getProtectedRxjsPipe()
  );

  override boardStatuses$ = combineLatest([
    this.board$,
    this.user$
  ]).pipe(
    switchMap(([board, user]) => {

      if (
        (!board && board === null) ||
        (!user && user === null)
      ) {
        this.resetSelectingBoardStatuses();
        return of(null);
      }

      if (board === undefined || user === undefined) {
        return of(undefined);
      }

      const boardRef = Board.ref(this._firestore, board.id);
      const boardStatusesRef = BoardStatus.collectionRef(boardRef);

      return collectionOnSnapshot(boardStatusesRef, limit(5)).pipe(
        map((querySnapBoardStatuses) => {

          const boardStatuses: { [key in string]: BoardStatus } = {};

          for (const querySnapDocBoardStatus of querySnapBoardStatuses.docs) {
            Object.assign(boardStatuses, {[querySnapDocBoardStatus.id]: BoardStatus.data(querySnapDocBoardStatus)});
          }

          return boardStatuses;
        }),
        tap(() => this.resetSelectingBoardStatuses())
      );
    }),
    getProtectedRxjsPipe()
  );

  override boardTasks$ = combineLatest([
    this.board$,
    this.user$
  ]).pipe(
    switchMap(([board, user]) => {

      if (
        (!board && board === null) ||
        (!user && user === null)
      ) {
        this.resetSelectingBoardTasks();
        return of(null);
      }

      if (board === undefined || user === undefined) {
        return of(undefined);
      }

      const boardRef = Board.ref(this._firestore, board.id);
      const boardTasksRef = BoardTask.collectionRef(boardRef);

      return collectionOnSnapshot(boardTasksRef, limit(20)).pipe(
        map((querySnapBoardTasks) => {

          const boardTasks: { [key in string]: BoardTask } = {};

          for (const querySnapDocBoardTask of querySnapBoardTasks.docs) {
            Object.assign(boardTasks, {[querySnapDocBoardTask.id]: BoardTask.data(querySnapDocBoardTask)});
          }

          return boardTasks;
        }),
        tap(() => this.resetSelectingBoardTasks())
      );
    }),
    getProtectedRxjsPipe()
  );

  override boardTask$ = new BehaviorSubject<BoardTask | null | undefined>(undefined);
  override boardTaskSubtasks$ = new BehaviorSubject<{ [key in string]: BoardTaskSubtask } | null | undefined>(undefined);

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

    const boardRef = Board.ref(this._firestore, boardId);
    const boardTaskRef = BoardTask.ref(boardRef, boardTaskId);
    const boardTaskSubtaskRef = BoardTaskSubtask.ref(boardTaskRef, boardTaskSubtaskId);

    return updateDoc(boardTaskSubtaskRef, {isCompleted});
  }
}
