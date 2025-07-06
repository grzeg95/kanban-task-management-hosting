import {Inject, Injectable} from '@angular/core';
import {Firestore, updateDoc} from 'firebase/firestore';
import {BehaviorSubject, catchError, defer, tap} from 'rxjs';
import {
  Board,
  BoardCreateData,
  BoardCreateResult,
  BoardDeleteData,
  BoardDeleteResult,
  BoardUpdateData,
  BoardUpdateResult
} from '../models/board';
import {BoardStatus} from '../models/board-status';
import {
  BoardTask,
  BoardTaskCreateData,
  BoardTaskCreateResult,
  BoardTaskDeleteData,
  BoardTaskDeleteResult,
  BoardTaskUpdateData,
  BoardTaskUpdateResult
} from '../models/board-task';
import {BoardTaskSubtask} from '../models/board-task-subtask';
import {FirestoreInjectionToken} from '../tokens/firebase';
import {FunctionsService} from './firebase/functions.service';
import {SnackBarService} from './snack-bar.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  readonly boardId$ = new BehaviorSubject<string | null | undefined>(null);
  readonly boardTaskId$ = new BehaviorSubject<string | null>(null);
  readonly board$ = new BehaviorSubject<Board | null | undefined>(undefined);
  readonly boardStatuses$ = new BehaviorSubject<Map<string, BoardStatus> | null | undefined>(undefined);
  readonly boardTasks$ = new BehaviorSubject<Map<string, BoardTask> | null | undefined>(undefined);
  readonly boardTask$ = new BehaviorSubject<BoardTask | null | undefined>(undefined);
  readonly boardTaskSubtasks$ = new BehaviorSubject<Map<string, BoardTaskSubtask> | null | undefined>(undefined);

  readonly loadingUserBoards$ = new BehaviorSubject(false);
  readonly loadingBoard$ = new BehaviorSubject(false);
  readonly loadingBoardStatuses$ = new BehaviorSubject(false);
  readonly loadingBoardTasks$ = new BehaviorSubject(false);
  readonly loadingBoardTaskSubtasks$ = new BehaviorSubject(false);

  readonly modificationUserBoards$ = new BehaviorSubject(0);
  readonly modificationBoard$ = new BehaviorSubject(0);
  readonly modificationBoardStatuses$ = new BehaviorSubject(0);
  readonly modificationBoardTasks$ = new BehaviorSubject(0);
  readonly modificationBoardTaskSubtasks$ = new BehaviorSubject(0);

  constructor(
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {
  }

  boardCreate(data: BoardCreateData) {

    this.modificationUserBoards$.next(this.modificationUserBoards$.value + 1);

    return this._functionsService.httpsCallable<BoardCreateData, BoardCreateResult>('board-create', data).pipe(
      tap(() => {

        this.modificationUserBoards$.next(this.modificationUserBoards$.value - 1);

        this._snackBarService.open('Board has been created', 3000);
      }),
      catchError((error) => {

        this.modificationUserBoards$.next(this.modificationUserBoards$.value - 1);

        throw error;
      })
    );
  }

  boardDelete(data: BoardDeleteData) {

    this.modificationUserBoards$.next(this.modificationUserBoards$.value + 1);
    this.modificationBoard$.next(this.modificationBoard$.value + 1);
    this.modificationBoardStatuses$.next(this.modificationBoardStatuses$.value + 1);
    this.modificationBoardTasks$.next(this.modificationBoardTasks$.value + 1);

    return this._functionsService.httpsCallable<BoardDeleteData, BoardDeleteResult>('board-delete', data).pipe(
      tap(() => {

        this.modificationUserBoards$.next(this.modificationUserBoards$.value - 1);
        this.modificationBoard$.next(this.modificationBoard$.value - 1);
        this.modificationBoardStatuses$.next(this.modificationBoardStatuses$.value - 1);
        this.modificationBoardTasks$.next(this.modificationBoardTasks$.value - 1);

        this._snackBarService.open('Board has been deleted', 3000);
      }),
      catchError((error) => {

        this.modificationUserBoards$.next(this.modificationUserBoards$.value - 1);
        this.modificationBoard$.next(this.modificationBoard$.value - 1);
        this.modificationBoardStatuses$.next(this.modificationBoardStatuses$.value - 1);
        this.modificationBoardTasks$.next(this.modificationBoardTasks$.value - 1);

        throw error;
      })
    );
  }

  boardUpdate(data: BoardUpdateData, boardNameWasChanged: boolean, boardStatusNameWasChanged: boolean, boardStatusAddedOrDeleted: boolean) {

    this.modificationUserBoards$.next(this.modificationUserBoards$.value + 1);
    this.modificationBoard$.next(this.modificationBoard$.value + 1);
    this.modificationBoardStatuses$.next(this.modificationBoardStatuses$.value + 1);
    this.modificationBoardTasks$.next(this.modificationBoardTasks$.value + 1);

    return this._functionsService.httpsCallable<BoardUpdateData, BoardUpdateResult>('board-update', data).pipe(
      tap(() => {

        this.modificationUserBoards$.next(this.modificationUserBoards$.value - 1);
        this.modificationBoard$.next(this.modificationBoard$.value - 1);
        this.modificationBoardStatuses$.next(this.modificationBoardStatuses$.value - 1);
        this.modificationBoardTasks$.next(this.modificationBoardTasks$.value - 1);

        this._snackBarService.open('Board has been updated', 3000);
      }),
      catchError((error) => {

        this.modificationUserBoards$.next(this.modificationUserBoards$.value - 1);
        this.modificationBoard$.next(this.modificationBoard$.value - 1);
        this.modificationBoardStatuses$.next(this.modificationBoardStatuses$.value - 1);
        this.modificationBoardTasks$.next(this.modificationBoardTasks$.value - 1);

        throw error;
      })
    );
  }

  boardTaskCreate(data: BoardTaskCreateData) {

    this.modificationUserBoards$.next(this.modificationUserBoards$.value + 1);
    this.modificationBoard$.next(this.modificationBoard$.value + 1);
    this.modificationBoardTasks$.next(this.modificationBoardTasks$.value + 1);
    this.modificationBoardTaskSubtasks$.next(this.modificationBoardTaskSubtasks$.value + 1);

    return this._functionsService.httpsCallable<BoardTaskCreateData, BoardTaskCreateResult>('board-task-create', data).pipe(
      tap(() => {

        this.modificationUserBoards$.next(this.modificationUserBoards$.value - 1);
        this.modificationBoard$.next(this.modificationBoard$.value - 1);
        this.modificationBoardTasks$.next(this.modificationBoardTasks$.value - 1);
        this.modificationBoardTaskSubtasks$.next(this.modificationBoardTaskSubtasks$.value - 1);

        this._snackBarService.open('Board task has been created', 3000);
      }),
      catchError((error) => {

        this.modificationUserBoards$.next(this.modificationUserBoards$.value - 1);
        this.modificationBoard$.next(this.modificationBoard$.value - 1);
        this.modificationBoardTasks$.next(this.modificationBoardTasks$.value - 1);
        this.modificationBoardTaskSubtasks$.next(this.modificationBoardTaskSubtasks$.value - 1);

        throw error;
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData) {

    this.modificationUserBoards$.next(this.modificationUserBoards$.value + 1);
    this.modificationBoard$.next(this.modificationBoard$.value + 1);
    this.modificationBoardTasks$.next(this.modificationBoardTasks$.value + 1);
    this.modificationBoardTaskSubtasks$.next(this.modificationBoardTaskSubtasks$.value + 1);

    return this._functionsService.httpsCallable<BoardTaskDeleteData, BoardTaskDeleteResult>('board-task-delete', data).pipe(
      tap(() => {

        this.modificationUserBoards$.next(this.modificationUserBoards$.value - 1);
        this.modificationBoard$.next(this.modificationBoard$.value - 1);
        this.modificationBoardTasks$.next(this.modificationBoardTasks$.value - 1);
        this.modificationBoardTaskSubtasks$.next(this.modificationBoardTaskSubtasks$.value - 1);

        this._snackBarService.open('Board task has been deleted', 3000);
      }),
      catchError((error) => {

        this.modificationUserBoards$.next(this.modificationUserBoards$.value - 1);
        this.modificationBoard$.next(this.modificationBoard$.value - 1);
        this.modificationBoardTasks$.next(this.modificationBoardTasks$.value - 1);
        this.modificationBoardTaskSubtasks$.next(this.modificationBoardTaskSubtasks$.value - 1);

        throw error;
      })
    );
  }

  boardTaskUpdate(data: BoardTaskUpdateData) {

    this.modificationBoardTasks$.next(this.modificationBoardTasks$.value + 1);
    this.modificationBoardTaskSubtasks$.next(this.modificationBoardTaskSubtasks$.value + 1);

    return this._functionsService.httpsCallable<BoardTaskUpdateData, BoardTaskUpdateResult>('board-task-update', data).pipe(
      tap(() => {

        this.modificationBoardTasks$.next(this.modificationBoardTasks$.value - 1);
        this.modificationBoardTaskSubtasks$.next(this.modificationBoardTaskSubtasks$.value - 1);

        this._snackBarService.open('Board task has been updated', 3000);
      }),
      catchError((error) => {

        this.modificationBoardTasks$.next(this.modificationBoardTasks$.value - 1);
        this.modificationBoardTaskSubtasks$.next(this.modificationBoardTaskSubtasks$.value - 1);

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
