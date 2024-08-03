import {effect, Inject, Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {Firestore, limit, updateDoc} from 'firebase/firestore';
import isEqual from 'lodash/isEqual';
import {catchError, defer, map, of, Subscription, takeWhile, tap} from 'rxjs';
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
import {User} from '../models/user';
import {UserBoard} from '../models/user-board';
import {FirestoreInjectionToken} from '../tokens/firebase';
import {Sig} from '../utils/Sig';
import {AuthService} from './auth.service';
import {collectionSnapshots, docSnapshots} from './firebase/firestore';
import {FunctionsService} from './firebase/functions.service';
import {SnackBarService} from './snack-bar.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  readonly user = this._authService.userSig.get();

  readonly boardIdSig = new Sig<string | null | undefined>(null);

  readonly boardTaskIdSig = new Sig<string | null>(null);

  readonly userBoardsSig = new Sig<UserBoard[] | null | undefined>(undefined);
  userBoardsSub: Subscription | undefined;

  readonly boardSig = new Sig<Board | null | undefined>(undefined);
  boardSub: Subscription | undefined;

  readonly boardStatusesSig = new Sig<Map<string, BoardStatus> | null | undefined>(undefined);
  _boardStatusesSub: Subscription | undefined;

  readonly boardTasksSig = new Sig<Map<string, BoardTask> | null | undefined>(undefined);
  _boardTasksSub: Subscription | undefined;

  readonly boardTaskSig = new Sig<BoardTask | null | undefined>(undefined);

  readonly boardTaskSubtasksSig = new Sig<Map<string, BoardTaskSubtask> | null | undefined>(undefined);
  _boardTaskSubtasksSub: Subscription | undefined;

  readonly loadingUserBoardsSig = new Sig(false);
  readonly loadingBoardSig = new Sig(false);
  readonly loadingBoardStatusesSig = new Sig(false);
  readonly loadingBoardTasksSig = new Sig(false);
  readonly loadingBoardTaskSubtasksSig = new Sig(false);

  readonly modificationUserBoardsSig = new Sig(0);
  readonly modificationBoardSig = new Sig(0);
  readonly modificationBoardStatusesSig = new Sig(0);
  readonly modificationBoardTasksSig = new Sig(0);
  readonly modificationBoardTaskSubtasksSig = new Sig(0);

  constructor(
    private readonly _authService: AuthService,
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {
  }

  boardCreate(data: BoardCreateData) {

    this.modificationUserBoardsSig.update((value) => (value || 0) + 1);

    return this._functionsService.httpsCallable<BoardCreateData, BoardCreateResult>('board-create', data).pipe(
      tap(() => {

        this.modificationUserBoardsSig.update((value) => (value || 0) - 1);

        this._snackBarService.open('Board has been created', 3000);
      }),
      catchError((error) => {

        this.modificationUserBoardsSig.update((value) => (value || 0) - 1);

        throw error;
      })
    );
  }

  boardDelete(data: BoardDeleteData) {

    this.modificationUserBoardsSig.update((value) => (value || 0) + 1);
    this.modificationBoardSig.update((value) => (value || 0) + 1);
    this.modificationBoardStatusesSig.update((value) => (value || 0) + 1);
    this.modificationBoardTasksSig.update((value) => (value || 0) + 1);

    return this._functionsService.httpsCallable<BoardDeleteData, BoardDeleteResult>('board-delete', data).pipe(
      tap(() => {

        this.modificationUserBoardsSig.update((value) => (value || 0) - 1);
        this.modificationBoardSig.update((value) => (value || 0) - 1);
        this.modificationBoardStatusesSig.update((value) => (value || 0) - 1);
        this.modificationBoardTasksSig.update((value) => (value || 0) - 1);

        this._snackBarService.open('Board has been deleted', 3000);
      }),
      catchError((error) => {

        this.modificationUserBoardsSig.update((value) => (value || 0) - 1);
        this.modificationBoardSig.update((value) => (value || 0) - 1);
        this.modificationBoardStatusesSig.update((value) => (value || 0) - 1);
        this.modificationBoardTasksSig.update((value) => (value || 0) - 1);

        throw error;
      })
    );
  }

  boardUpdate(data: BoardUpdateData, boardNameWasChanged: boolean, boardStatusNameWasChanged: boolean, boardStatusAddedOrDeleted: boolean) {

    this.modificationUserBoardsSig.update((value) => (value || 0) + 1);
    this.modificationBoardSig.update((value) => (value || 0) + 1);
    this.modificationBoardStatusesSig.update((value) => (value || 0) + 1);
    this.modificationBoardTasksSig.update((value) => (value || 0) + 1);

    return this._functionsService.httpsCallable<BoardUpdateData, BoardUpdateResult>('board-update', data).pipe(
      tap(() => {

        this.modificationUserBoardsSig.update((value) => (value || 0) - 1);
        this.modificationBoardSig.update((value) => (value || 0) - 1);
        this.modificationBoardStatusesSig.update((value) => (value || 0) - 1);
        this.modificationBoardTasksSig.update((value) => (value || 0) - 1);

        this._snackBarService.open('Board has been updated', 3000);
      }),
      catchError((error) => {

        this.modificationUserBoardsSig.update((value) => (value || 0) - 1);
        this.modificationBoardSig.update((value) => (value || 0) - 1);
        this.modificationBoardStatusesSig.update((value) => (value || 0) - 1);
        this.modificationBoardTasksSig.update((value) => (value || 0) - 1);

        throw error;
      })
    );
  }

  boardTaskCreate(data: BoardTaskCreateData) {

    this.modificationUserBoardsSig.update((value) => (value || 0) + 1);
    this.modificationBoardSig.update((value) => (value || 0) + 1);
    this.modificationBoardTasksSig.update((value) => (value || 0) + 1);
    this.modificationBoardTaskSubtasksSig.update((value) => (value || 0) + 1);

    return this._functionsService.httpsCallable<BoardTaskCreateData, BoardTaskCreateResult>('board-task-create', data).pipe(
      tap(() => {

        this.modificationUserBoardsSig.update((value) => (value || 0) - 1);
        this.modificationBoardSig.update((value) => (value || 0) - 1);
        this.modificationBoardTasksSig.update((value) => (value || 0) - 1);
        this.modificationBoardTaskSubtasksSig.update((value) => (value || 0) - 1);

        this._snackBarService.open('Board task has been created', 3000);
      }),
      catchError((error) => {

        this.modificationUserBoardsSig.update((value) => (value || 0) - 1);
        this.modificationBoardSig.update((value) => (value || 0) - 1);
        this.modificationBoardTasksSig.update((value) => (value || 0) - 1);
        this.modificationBoardTaskSubtasksSig.update((value) => (value || 0) - 1);

        throw error;
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData) {

    this.modificationUserBoardsSig.update((value) => (value || 0) + 1);
    this.modificationBoardSig.update((value) => (value || 0) + 1);
    this.modificationBoardTasksSig.update((value) => (value || 0) + 1);
    this.modificationBoardTaskSubtasksSig.update((value) => (value || 0) + 1);

    return this._functionsService.httpsCallable<BoardTaskDeleteData, BoardTaskDeleteResult>('board-task-delete', data).pipe(
      tap(() => {

        this.modificationUserBoardsSig.update((value) => (value || 0) - 1);
        this.modificationBoardSig.update((value) => (value || 0) - 1);
        this.modificationBoardTasksSig.update((value) => (value || 0) - 1);
        this.modificationBoardTaskSubtasksSig.update((value) => (value || 0) - 1);

        this._snackBarService.open('Board task has been deleted', 3000);
      }),
      catchError((error) => {

        this.modificationUserBoardsSig.update((value) => (value || 0) - 1);
        this.modificationBoardSig.update((value) => (value || 0) - 1);
        this.modificationBoardTasksSig.update((value) => (value || 0) - 1);
        this.modificationBoardTaskSubtasksSig.update((value) => (value || 0) - 1);

        throw error;
      })
    );
  }

  boardTaskUpdate(data: BoardTaskUpdateData) {

    this.modificationBoardTasksSig.update((value) => (value || 0) + 1);
    this.modificationBoardTaskSubtasksSig.update((value) => (value || 0) + 1);

    return this._functionsService.httpsCallable<BoardTaskUpdateData, BoardTaskUpdateResult>('board-task-update', data).pipe(
      tap(() => {

        this.modificationBoardTasksSig.update((value) => (value || 0) - 1);
        this.modificationBoardTaskSubtasksSig.update((value) => (value || 0) - 1);

        this._snackBarService.open('Board task has been updated', 3000);
      }),
      catchError((error) => {

        this.modificationBoardTasksSig.update((value) => (value || 0) - 1);
        this.modificationBoardTaskSubtasksSig.update((value) => (value || 0) - 1);

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
