import {effect, Inject, Injectable} from '@angular/core';
import {Firestore, limit, updateDoc} from 'firebase/firestore';
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
  readonly firstLoadingUserBoardsSig = new Sig(true);
  readonly loadingBoardSig = new Sig(false);
  readonly firstLoadingBoardSig = new Sig(true);
  readonly loadingBoardStatusesSig = new Sig(false);
  readonly firstLoadingBoardStatusesSig = new Sig(true);
  readonly loadingBoardTasksSig = new Sig(false);
  readonly firstLoadingBoardTasksSig = new Sig(true);
  readonly loadingBoardTaskSubtasksSig = new Sig(false);
  readonly firstLoadingBoardTaskSubtasksSig = new Sig(true);

  constructor(
    private readonly _authService: AuthService,
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {

    // userBoards
    let userBoards_userId: string | undefined;
    let userBoards_userConfigMaxUserBoards: number | undefined;
    effect((onCleanup) => {

      const user = this.user();

      if (!user) {
        this.userBoardsSig.set(undefined);
        return;
      }

      if (userBoards_userId === user.id) {
        return;
      }
      userBoards_userId = user.id;

      if (userBoards_userConfigMaxUserBoards === user.config.maxUserBoards) {
        return;
      }
      userBoards_userConfigMaxUserBoards = user.config.maxUserBoards;

      const userBoardCollectionRef = UserBoard.firestoreCollectionRef(User.firestoreRef(this._firestore, userBoards_userId));

      this.loadingUserBoardsSig.set(true);
      this._userBoardsSub && !this._userBoardsSub.closed && this._userBoardsSub.unsubscribe();
      this._userBoardsSub = collectionSnapshots(userBoardCollectionRef, limit(userBoards_userConfigMaxUserBoards)).pipe(
        catchError(() => of(null)),
        takeWhile(() => !!this.user())
      ).subscribe((querySnapUserBoards) => {

        this.loadingUserBoardsSig.set(false);
        this.firstLoadingUserBoardsSig.set(false);

        if (!querySnapUserBoards) {
          return;
        }

        const userBoards = [];

        for (const queryDocSnapUserBoard of querySnapUserBoards.docs) {
          userBoards.push(UserBoard.firestoreData(queryDocSnapUserBoard));
        }

        this.userBoardsSig.set(userBoards);
      });

      onCleanup(() => {
        this._userBoardsSub && !this._userBoardsSub.closed && this._userBoardsSub.unsubscribe();
      });
    });

    // board
    let board_boardId: string | undefined;
    effect((onCleanup) => {

      const boardId = this._boardId();

      if (!boardId) {
        this.boardSig.set(undefined);
        return;
      }

      if (board_boardId === boardId) {
        return;
      }
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
        this.firstLoadingBoardSig.set(false);

        if (!board) {
          this.boardSig.set(null);
          return;
        }

        this.boardSig.set(board);
      });

      onCleanup(() => {
        this._boardSub && !this._boardSub.closed && this._boardSub.unsubscribe();
      });
    });

    // boardStatuses
    let boardStatuses_boardId: string | undefined;
    let boardStatuses_userConfigMaxBoardStatuses: number | undefined;
    effect((onCleanup) => {

      const board = this._board();
      const user = this.user();

      if (!board || !user) {
        this.boardStatusesSig.set(undefined);
        return;
      }

      if (boardStatuses_boardId === board.id) {
        return;
      }
      boardStatuses_boardId = board.id;

      if (boardStatuses_userConfigMaxBoardStatuses === user.config.maxBoardStatuses) {
        return;
      }
      boardStatuses_userConfigMaxBoardStatuses = user.config.maxBoardStatuses;

      const boardRef = Board.firestoreRef(this._firestore, boardStatuses_boardId);
      const boardStatusesRef = BoardStatus.firestoreCollectionRef(boardRef);

      this.loadingBoardStatusesSig.set(true);
      this._boardStatusesSub && !this._boardStatusesSub.closed && this._boardStatusesSub.unsubscribe();
      this._boardStatusesSub = collectionSnapshots(boardStatusesRef, limit(boardStatuses_userConfigMaxBoardStatuses)).pipe(
        catchError(() => of(null)),
        takeWhile(() => !!this._board() && !!this.user())
      ).subscribe((querySnapBoardStatuses) => {

        this.loadingBoardStatusesSig.set(false);
        this.firstLoadingBoardStatusesSig.set(false);

        if (!querySnapBoardStatuses) {
          this.boardStatusesSig.set(null);
          return;
        }

        const querySnapBoardStatusesMap = new Map<string, BoardStatus>();

        for (const queryDocSnapBoardStatus of querySnapBoardStatuses.docs) {
          querySnapBoardStatusesMap.set(queryDocSnapBoardStatus.id, BoardStatus.firestoreData(queryDocSnapBoardStatus));
        }

        this.boardStatusesSig.set(querySnapBoardStatusesMap);
      });

      onCleanup(() => {
        this._boardStatusesSub && !this._boardStatusesSub.closed && this._boardStatusesSub.unsubscribe();
      });
    });

    // boardTasks
    let boardTasks_boardId: string | undefined;
    let boardStatuses_userConfigMaxBoardTasks: number | undefined;
    effect((onCleanup) => {

      const board = this._board();
      const user = this.user();

      if (!board || !user) {
        this.boardTasksSig.set(undefined);
        return;
      }

      if (boardTasks_boardId === board.id) {
        return;
      }
      boardTasks_boardId = board.id;

      if (boardStatuses_userConfigMaxBoardTasks === user.config.maxBoardTasks) {
        return;
      }
      boardStatuses_userConfigMaxBoardTasks = user.config.maxBoardTasks;

      const boardRef = Board.firestoreRef(this._firestore, boardTasks_boardId);
      const boardTasksRef = BoardTask.firestoreCollectionRef(boardRef);

      this.loadingBoardTasksSig.set(true);
      this._boardTasksSub && !this._boardTasksSub.closed && this._boardTasksSub.unsubscribe();
      this._boardTasksSub = collectionSnapshots(boardTasksRef, limit(boardStatuses_userConfigMaxBoardTasks)).pipe(
        catchError(() => of(null)),
        takeWhile(() => !!this._board() && !!this.user())
      ).subscribe((querySnapBoardTasks) => {

        this.loadingBoardTasksSig.set(false);
        this.firstLoadingBoardTasksSig.set(false);

        if (!querySnapBoardTasks) {
          this.boardTasksSig.set(null);
          return;
        }

        const querySnapUserBoardTasksMap = new Map<string, BoardTask>();

        for (const queryDocSnapBoardTask of querySnapBoardTasks.docs) {
          querySnapUserBoardTasksMap.set(queryDocSnapBoardTask.id, BoardTask.firestoreData(queryDocSnapBoardTask));
        }

        this.boardTasksSig.set(querySnapUserBoardTasksMap);
      });

      onCleanup(() => {
        this._boardTasksSub && !this._boardTasksSub.closed && this._boardTasksSub.unsubscribe();
      });
    });

    // boardTask
    effect(() => {

      const boardTasks = this._boardTasks();
      const boardTaskId = this._boardTaskId();

      if (!boardTasks || !boardTaskId) {
        this.boardTaskSig.set(undefined);
        return;
      }

      this.boardTaskSig.set(boardTasks.get(boardTaskId) || null);
    });

    // boardTaskSubtasks
    let boardTaskSubtasks_boardId: string | undefined;
    let boardTaskSubtasks_boardTaskId: string | undefined;
    effect((onCleanup) => {

      const board = this._board();
      const boardTask = this._boardTask();
      const user = this.user();

      if (!board || !boardTask || !user) {
        this.boardTaskSubtasksSig.set(undefined);
        return;
      }

      if (boardTaskSubtasks_boardId === board.id) {
        return;
      }
      boardTaskSubtasks_boardId = board.id;

      if (boardTaskSubtasks_boardTaskId === boardTask.id) {
        return;
      }
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
        this.firstLoadingBoardTaskSubtasksSig.set(false);

        if (!querySnapBoardTaskSubtasks) {
          this.boardTaskSubtasksSig.set(null);
          return;
        }

        const querySnapUserBoardTaskSubtasksMap = new Map<string, BoardTaskSubtask>();

        for (const queryDocSnapBoardTaskSubtask of querySnapBoardTaskSubtasks.docs) {
          querySnapUserBoardTaskSubtasksMap.set(queryDocSnapBoardTaskSubtask.id, BoardTaskSubtask.firestoreData(queryDocSnapBoardTaskSubtask));
        }

        this.boardTaskSubtasksSig.set(querySnapUserBoardTaskSubtasksMap);
      });

      onCleanup(() => {
        this._boardTaskSubtasksSub && !this._boardTaskSubtasksSub.closed && this._boardTaskSubtasksSub.unsubscribe();
      });
    });
  }

  boardCreate(data: BoardCreateData) {

    this.loadingUserBoardsSig.set(true);

    return this._functionsService.httpsCallable<BoardCreateData, BoardCreateResult>('board-create', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been created', 3000);
      }),
      catchError((error) => {

        this.loadingUserBoardsSig.set(false);

        throw error;
      })
    );
  }

  boardDelete(data: BoardDeleteData) {

    this.loadingUserBoardsSig.set(true);

    return this._functionsService.httpsCallable<BoardDeleteData, BoardDeleteResult>('board-delete', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been deleted', 3000);
      }),
      catchError((error) => {
        this.loadingUserBoardsSig.set(false);
        throw error;
      })
    );
  }

  boardUpdate(data: BoardUpdateData, boardNameWasChanged: boolean, boardStatusNameWasChanged: boolean, boardStatusAddedOrDeleted: boolean) {

    if (this._boardId()) {
      if (boardNameWasChanged) {
        this.loadingBoardSig.set(true);
        this.loadingUserBoardsSig.set(true);
      }

      if (boardStatusNameWasChanged || boardStatusAddedOrDeleted) {
        this.loadingBoardStatusesSig.set(true);
      }

      if (boardStatusAddedOrDeleted) {
        this.loadingBoardTasksSig.set(true);
      }
    }

    return this._functionsService.httpsCallable<BoardUpdateData, BoardUpdateResult>('board-update', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been updated', 3000);
      }),
      catchError((error) => {

        if (this._boardId()) {
          if (boardNameWasChanged) {
            this.loadingBoardSig.set(false);
            this.loadingUserBoardsSig.set(false);
          }

          if (boardStatusNameWasChanged || boardStatusAddedOrDeleted) {
            this.loadingBoardStatusesSig.set(false);
          }

          if (boardStatusAddedOrDeleted) {
            this.loadingBoardTasksSig.set(false);
          }
        }

        throw error;
      })
    );
  }

  boardTaskCreate(data: BoardTaskCreateData) {

    if (this._boardId()) {
      this.loadingBoardTasksSig.set(true);
      this.loadingBoardStatusesSig.set(true);
    }

    return this._functionsService.httpsCallable<BoardTaskCreateData, BoardTaskCreateResult>('board-task-create', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been created', 3000);
      }),
      catchError((error) => {

        if (this._boardId()) {
          this.loadingBoardTasksSig.set(false);
          this.loadingBoardStatusesSig.set(false);
        }

        throw error;
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData) {

    if (this._boardId()) {
      this.loadingBoardTasksSig.set(true);
      this.loadingBoardStatusesSig.set(true);
    }

    return this._functionsService.httpsCallable<BoardTaskDeleteData, BoardTaskDeleteResult>('board-task-delete', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been deleted', 3000);
      }),
      catchError((error) => {

        if (this._boardId()) {
          this.loadingBoardTasksSig.set(false);
          this.loadingBoardStatusesSig.set(false);
        }

        throw error;
      })
    );
  }

  boardTaskUpdate(data: BoardTaskUpdateData) {

    if (this._boardId()) {
      this.loadingBoardTasksSig.set(true);
      this.loadingBoardStatusesSig.set(true);
    }

    return this._functionsService.httpsCallable<BoardTaskUpdateData, BoardTaskUpdateResult>('board-task-update', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been updated', 3000);
      }),
      catchError((error) => {

        if (this._boardId()) {
          this.loadingBoardTasksSig.set(false);
          this.loadingBoardStatusesSig.set(false);
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
