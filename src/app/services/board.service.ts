import {effect, Inject, Injectable} from '@angular/core';
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
  readonly _authStateReady = this._authService.authStateReady;

  readonly boardIdSig = new Sig<string | null | undefined>(null);
  private readonly _boardId = this.boardIdSig.get();

  readonly boardTaskIdSig = new Sig<string | null>(null);
  private readonly _boardTaskId = this.boardTaskIdSig.get();

  readonly userBoardsSig = new Sig<UserBoard[] | null | undefined>(undefined);
  private _userBoardsSub: Subscription | undefined;

  readonly boardSig = new Sig<Board | null | undefined>(undefined);
  private readonly _board = this.boardSig.get();
  private _boardSub: Subscription | undefined;

  readonly boardStatusesSig = new Sig<Map<string, BoardStatus> | null | undefined>(undefined);
  private _boardStatusesSub: Subscription | undefined;

  readonly boardTasksSig = new Sig<Map<string, BoardTask> | null | undefined>(undefined);
  private readonly _boardTasks = this.boardTasksSig.get();
  private _boardTasksSub: Subscription | undefined;

  readonly boardTaskSig = new Sig<BoardTask | null | undefined>(undefined);
  private readonly _boardTask = this.boardTaskSig.get()

  readonly boardTaskSubtasksSig = new Sig<Map<string, BoardTaskSubtask> | null | undefined>(undefined);
  private _boardTaskSubtasksSub: Subscription | undefined;

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

    // userBoards
    let userBoards_userId: string | undefined;
    let userBoards_userBoardsIds: string[] | undefined;
    let userBoards_userConfigMaxUserBoards: number | undefined;
    effect(() => {

      const user = this.user();
      const authStateReady = this._authStateReady();

      if (!authStateReady) {
        return;
      }

      if (!user) {
        this.userBoardsSig.set(null);
        userBoards_userId = undefined;
        userBoards_userBoardsIds = undefined;
        userBoards_userConfigMaxUserBoards = undefined;
        this._userBoardsSub && !this._userBoardsSub.closed && this._userBoardsSub.unsubscribe();
        return;
      }

      if (
        userBoards_userId === user.id &&
        isEqual(userBoards_userBoardsIds, user.boardsIds) &&
        userBoards_userConfigMaxUserBoards === user.config.maxUserBoards &&
        this._userBoardsSub && !this._userBoardsSub.closed
      ) {
        return;
      }

      userBoards_userId = user.id;
      userBoards_userBoardsIds = user.boardsIds;
      userBoards_userConfigMaxUserBoards = user.config.maxUserBoards;

      const userBoardCollectionRef = UserBoard.firestoreCollectionRef(User.firestoreRef(this._firestore, userBoards_userId));

      this.loadingUserBoardsSig.set(true);
      this._userBoardsSub && !this._userBoardsSub.closed && this._userBoardsSub.unsubscribe();
      this._userBoardsSub = collectionSnapshots(userBoardCollectionRef, limit(userBoards_userConfigMaxUserBoards)).pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        }),
        takeWhile(() => !!this.user())
      ).subscribe((querySnapUserBoards) => {

        this.loadingUserBoardsSig.set(false);

        if (!querySnapUserBoards) {
          return;
        }

        const userBoards = [];

        for (const queryDocSnapUserBoard of querySnapUserBoards.docs) {
          userBoards.push(UserBoard.firestoreData(queryDocSnapUserBoard));
        }

        this.userBoardsSig.set(userBoards);
      });
    });

    // board
    let board_userId: string | undefined;
    let board_boardId: string | undefined;
    effect(() => {

      const user = this.user();
      const boardId = this._boardId();

      if (!user || !boardId) {
        this.boardSig.set(null);
        board_userId = undefined;
        board_boardId = undefined;
        this._boardSub && !this._boardSub.closed && this._boardSub.unsubscribe();
        return;
      }

      if (
        board_userId === user.id &&
        board_boardId === boardId
      ) {
        return;
      }

      board_userId = user.id;
      board_boardId = boardId;

      const boardRef = Board.firestoreRef(this._firestore, board_boardId);

      this.loadingBoardSig.set(true);
      this._boardSub && !this._boardSub.closed && this._boardSub.unsubscribe();
      this._boardSub = docSnapshots(boardRef).pipe(
        map((docSnap) => Board.firestoreData(docSnap)),
        catchError(() => of(null)),
        takeWhile(() => !!this._boardId()),
      ).subscribe((board) => {

        this.loadingBoardSig.set(false);

        if (!board || !board.exists) {
          this.boardSig.set(undefined);
          this.boardIdSig.set(undefined);
          return;
        }

        this.boardSig.set(board);
      });
    });

    // boardStatuses
    let boardStatuses_userId: string | undefined;
    let boardStatuses_userConfigMaxBoardStatuses: number | undefined;
    let boardStatuses_boardId: string | undefined;
    effect(() => {

      const user = this.user();
      const board = this._board();

      if (!user || !board) {
        this.boardStatusesSig.set(null);
        boardStatuses_userId = undefined;
        boardStatuses_userConfigMaxBoardStatuses = undefined;
        boardStatuses_boardId = undefined;
        this._boardStatusesSub && !this._boardStatusesSub.closed && this._boardStatusesSub.unsubscribe();
        return;
      }

      if (
        boardStatuses_userId === user.id &&
        boardStatuses_userConfigMaxBoardStatuses === user.config.maxBoardStatuses &&
        boardStatuses_boardId === board.id
      ) {
        return;
      }

      boardStatuses_userId = user.id;
      boardStatuses_userConfigMaxBoardStatuses = user.config.maxBoardStatuses;
      boardStatuses_boardId = board.id;

      const boardRef = Board.firestoreRef(this._firestore, boardStatuses_boardId);
      const boardStatusesRef = BoardStatus.firestoreCollectionRef(boardRef);

      this.loadingBoardStatusesSig.set(true);
      this._boardStatusesSub && !this._boardStatusesSub.closed && this._boardStatusesSub.unsubscribe();
      this._boardStatusesSub = collectionSnapshots(boardStatusesRef, limit(boardStatuses_userConfigMaxBoardStatuses)).pipe(
        catchError(() => of(null)),
        takeWhile(() => !!this._board() && !!this.user())
      ).subscribe((querySnapBoardStatuses) => {

        this.loadingBoardStatusesSig.set(false);

        if (!querySnapBoardStatuses) {
          this.boardStatusesSig.set(undefined);
          return;
        }

        const querySnapBoardStatusesMap = new Map<string, BoardStatus>();

        for (const queryDocSnapBoardStatus of querySnapBoardStatuses.docs) {
          querySnapBoardStatusesMap.set(queryDocSnapBoardStatus.id, BoardStatus.firestoreData(queryDocSnapBoardStatus));
        }

        this.boardStatusesSig.set(querySnapBoardStatusesMap);
      });
    });

    // boardTasks
    let boardTasks_userId: string | undefined;
    let boardStatuses_userConfigMaxBoardTasks: number | undefined;
    effect(() => {

      const user = this.user();
      const board = this._board();

      if (!user || !board) {
        this.boardTasksSig.set(null);
        boardTasks_userId = undefined;
        boardStatuses_userConfigMaxBoardTasks = undefined;
        this._boardTasksSub && !this._boardTasksSub.closed && this._boardTasksSub.unsubscribe();
        return;
      }

      if (
        boardTasks_userId === user.id &&
        boardStatuses_userConfigMaxBoardTasks === user.config.maxBoardTasks &&
        boardTasks_boardId === board.id
      ) {
        return;
      }

      boardTasks_userId = user.id;
      boardStatuses_userConfigMaxBoardTasks = user.config.maxBoardTasks;
      boardTasks_boardId = board.id;

      const boardRef = Board.firestoreRef(this._firestore, boardTasks_boardId);
      const boardTasksRef = BoardTask.firestoreCollectionRef(boardRef);

      this.loadingBoardTasksSig.set(true);
      this._boardTasksSub && !this._boardTasksSub.closed && this._boardTasksSub.unsubscribe();
      this._boardTasksSub = collectionSnapshots(boardTasksRef, limit(boardStatuses_userConfigMaxBoardTasks)).pipe(
        catchError(() => of(null)),
        takeWhile(() => !!this._board() && !!this.user())
      ).subscribe((querySnapBoardTasks) => {

        this.loadingBoardTasksSig.set(false);

        if (!querySnapBoardTasks) {
          this.boardTasksSig.set(undefined);
          return;
        }

        const querySnapUserBoardTasksMap = new Map<string, BoardTask>();

        for (const queryDocSnapBoardTask of querySnapBoardTasks.docs) {
          querySnapUserBoardTasksMap.set(queryDocSnapBoardTask.id, BoardTask.firestoreData(queryDocSnapBoardTask));
        }

        this.boardTasksSig.set(querySnapUserBoardTasksMap);
      });
    });
    let boardTasks_boardId: string | undefined;

    // boardTask
    effect(() => {

      const boardTasks = this._boardTasks();
      const boardTaskId = this._boardTaskId();

      this.boardTaskSig.set(boardTasks?.get(boardTaskId || ''));
    });

    // boardTaskSubtasks
    let boardTaskSubtasks_userId: string | undefined;
    let boardTaskSubtasks_boardId: string | undefined;
    let boardTaskSubtasks_boardTaskId: string | undefined;
    effect(() => {

      const board = this._board();
      const boardTask = this._boardTask();
      const user = this.user();

      if (!board || !boardTask || !user) {
        this.boardTaskSubtasksSig.set(undefined);
        boardTaskSubtasks_userId = undefined;
        boardTaskSubtasks_boardId = undefined;
        boardTaskSubtasks_boardTaskId = undefined;
        this._boardTaskSubtasksSub && !this._boardTaskSubtasksSub.closed && this._boardTaskSubtasksSub.unsubscribe();
        return;
      }

      if (
        boardTaskSubtasks_userId === user.id &&
        boardTaskSubtasks_boardId === board.id &&
        boardTaskSubtasks_boardTaskId === boardTask.id
      ) {
        return;
      }

      boardTaskSubtasks_userId = user.id;
      boardTaskSubtasks_boardId = board.id;
      boardTaskSubtasks_boardTaskId = boardTask.id;

      const boardRef = Board.firestoreRef(this._firestore, boardTaskSubtasks_boardId);
      const boardTaskRef = BoardTask.firestoreRef(boardRef, boardTaskSubtasks_boardTaskId);
      const boardTaskSubtasksRef = BoardTaskSubtask.firestoreRefs(boardTaskRef);

      this.loadingBoardTaskSubtasksSig.set(true);
      this._boardTaskSubtasksSub && !this._boardTaskSubtasksSub.closed && this._boardTaskSubtasksSub.unsubscribe();
      this._boardTaskSubtasksSub = collectionSnapshots(boardTaskSubtasksRef, limit(user.config.maxBoardTaskSubtasks)).pipe(
        catchError(() => of(null)),
        takeWhile(() => !!this._board() && !!this._boardTask() && !!this.user())
      ).subscribe((querySnapBoardTaskSubtasks) => {

        this.loadingBoardTaskSubtasksSig.set(false);

        if (!querySnapBoardTaskSubtasks) {
          this.boardTaskSubtasksSig.set(undefined);
          return;
        }

        const querySnapUserBoardTaskSubtasksMap = new Map<string, BoardTaskSubtask>();

        for (const queryDocSnapBoardTaskSubtask of querySnapBoardTaskSubtasks.docs) {
          querySnapUserBoardTaskSubtasksMap.set(queryDocSnapBoardTaskSubtask.id, BoardTaskSubtask.firestoreData(queryDocSnapBoardTaskSubtask));
        }

        this.boardTaskSubtasksSig.set(querySnapUserBoardTaskSubtasksMap);
      });
    });
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
