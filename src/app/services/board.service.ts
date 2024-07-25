import {effect, Inject, Injectable, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Firestore, limit, updateDoc} from 'firebase/firestore';
import {catchError, defer, map, of, Subscription, tap} from 'rxjs';
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
import {AuthService} from './auth/auth.service';
import {collectionSnapshots, docSnapshots} from './firebase/firestore';
import {FunctionsService} from './firebase/functions.service';
import {SnackBarService} from './snack-bar.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  private readonly _boardIdSig = signal<string | null | undefined>(null);

  getBoardId() {
    return this._boardIdSig.asReadonly();
  }

  set boardId(boardId: string | null | undefined) {
    setTimeout(() => this._boardIdSig.set(boardId));
  }

  private readonly _boardTaskIdSig = signal<string | null>(null);

  getBoardTaskId() {
    return this._boardTaskIdSig.asReadonly();
  }

  set boardTaskId(boardTaskId: string | null) {
    setTimeout(() => this._boardTaskIdSig.set(boardTaskId));
  }

  readonly userSig = toSignal(this._authService.user$);

  private readonly _userBoardsSig = signal<UserBoard[] | null | undefined>(undefined);

  getUserBoards() {
    return this._userBoardsSig.asReadonly();
  }

  set userBoards(userBoards: UserBoard[] | null | undefined) {
    setTimeout(() => this._userBoardsSig.set(userBoards));
  }

  userBoardsSub: Subscription | undefined;

  private readonly _boardSig = signal<Board | null | undefined>(undefined);

  getBoard() {
    return this._boardSig.asReadonly();
  }

  set board(board: Board | null | undefined) {
    setTimeout(() => this._boardSig.set(board));
  }

  boardSub: Subscription | undefined;

  private readonly _boardStatusesSig = signal<Map<string, BoardStatus> | null | undefined>(undefined);

  getBoardStatuses() {
    return this._boardStatusesSig.asReadonly();
  }

  set boardStatuses(boardStatuses: Map<string, BoardStatus> | null | undefined) {
    setTimeout(() => this._boardStatusesSig.set(boardStatuses));
  }

  boardStatusesSub: Subscription | undefined;

  private readonly _boardTasksSig = signal<Map<string, BoardTask> | null | undefined>(undefined);

  getBoardTasks() {
    return this._boardTasksSig.asReadonly();
  }

  set boardTasks(boardTasks: Map<string, BoardTask> | null | undefined) {
    setTimeout(() => this._boardTasksSig.set(boardTasks));
  }

  boardTasksSub: Subscription | undefined;

  private readonly _boardTaskSig = signal<BoardTask | null | undefined>(undefined);

  getBoardTask() {
    return this._boardTaskSig.asReadonly();
  }

  set boardTask(boardTask: BoardTask | null | undefined) {
    setTimeout(() => this._boardTaskSig.set(boardTask));
  }

  private readonly _boardTaskSubtasksSig = signal<Map<string, BoardTaskSubtask> | null | undefined>(undefined);

  getBoardTaskSubtasks() {
    return this._boardTaskSubtasksSig.asReadonly();
  }

  set boardTaskSubtasks(boardTaskSubtasks: Map<string, BoardTaskSubtask> | null | undefined) {
    setTimeout(() => this._boardTaskSubtasksSig.set(boardTaskSubtasks));
  }

  boardTaskSubtasksSub: Subscription | undefined;

  private readonly _loadingUserBoardsSig = signal(false);

  getLoadingUserBoards() {
    return this._loadingUserBoardsSig.asReadonly();
  }

  set loadingUserBoards(loadingUserBoards: boolean) {
    setTimeout(() => this._loadingUserBoardsSig.set(loadingUserBoards));
  }

  private readonly _firstLoadingUserBoardsSig = signal(true);

  getFirstLoadingUserBoards() {
    return this._firstLoadingUserBoardsSig.asReadonly();
  }

  set firstLoadingUserBoards(firstLoadingUserBoards: boolean) {
    setTimeout(() => this._firstLoadingUserBoardsSig.set(firstLoadingUserBoards));
  }

  private readonly _loadingBoardSig = signal(false);

  getLoadingBoard() {
    return this._loadingBoardSig.asReadonly();
  }

  set loadingBoard(loadingBoard: boolean) {
    setTimeout(() => this._loadingBoardSig.set(loadingBoard));
  }

  private readonly _firstLoadingBoardSig = signal(true);

  getFirstLoadingBoard() {
    return this._firstLoadingBoardSig.asReadonly();
  }

  set firstLoadingBoard(firstLoadingBoard: boolean) {
    setTimeout(() => this._firstLoadingBoardSig.set(firstLoadingBoard));
  }

  private readonly _loadingBoardStatusesSig = signal(false);

  getLoadingBoardStatuses() {
    return this._loadingBoardStatusesSig.asReadonly();
  }

  set loadingBoardStatuses(loadingBoardStatuses: boolean) {
    setTimeout(() => this._loadingBoardStatusesSig.set(loadingBoardStatuses));
  }

  private readonly _firstLoadingBoardStatusesSig = signal(true);

  getFirstLoadingBoardStatuses() {
    return this._firstLoadingBoardStatusesSig.asReadonly();
  }

  set firstLoadingBoardStatuses(firstLoadingBoardStatuses: boolean) {
    setTimeout(() => this._firstLoadingBoardStatusesSig.set(firstLoadingBoardStatuses));
  }

  private readonly _loadingBoardTasksSig = signal(false);

  getLoadingBoardTasks() {
    return this._loadingBoardTasksSig.asReadonly();
  }

  set loadingBoardTasks(loadingBoardTasks: boolean) {
    setTimeout(() => this._loadingBoardTasksSig.set(loadingBoardTasks));
  }

  private readonly _firstLoadingBoardTasksSig = signal(true);

  getFirstLoadingBoardTasks() {
    return this._firstLoadingBoardTasksSig.asReadonly();
  }

  set firstLoadingBoardTasks(firstLoadingBoardTasks: boolean) {
    setTimeout(() => this._firstLoadingBoardTasksSig.set(firstLoadingBoardTasks));
  }

  private readonly _loadingBoardTaskSubtasksSig = signal(false);

  getLoadingBoardTaskSubtasks() {
    return this._loadingBoardTaskSubtasksSig.asReadonly();
  }

  set loadingBoardTaskSubtasks(loadingBoardTaskSubtasks: boolean) {
    setTimeout(() => this._loadingBoardTaskSubtasksSig.set(loadingBoardTaskSubtasks));
  }

  private readonly _firstLoadingBoardTaskSubtasksSig = signal(true);

  getFirstLoadingBoardTaskSubtasks() {
    return this._firstLoadingBoardTaskSubtasksSig.asReadonly();
  }

  set firstLoadingBoardTaskSubtasks(firstLoadingBoardTaskSubtasks: boolean) {
    setTimeout(() => this._firstLoadingBoardTaskSubtasksSig.set(firstLoadingBoardTaskSubtasks));
  }

  constructor(
    private readonly _authService: AuthService,
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {

    // userBoards
    effect(() => {

      const user = this.userSig();

      this.userBoardsSub && !this.userBoardsSub.closed && this.userBoardsSub.unsubscribe();

      if (!user) {
        this.userBoards = undefined;
        return;
      }

      this.loadingUserBoards = true;
      const userBoardCollectionRef = UserBoard.firestoreCollectionRef(User.firestoreRef(this._firestore, user.id));

      this.userBoardsSub = collectionSnapshots(userBoardCollectionRef, limit(user.config.maxUserBoards)).pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      ).subscribe((querySnapUserBoards) => {

        this.loadingUserBoards = false;
        this.firstLoadingUserBoards = false;

        if (!querySnapUserBoards) {
          return;
        }

        const userBoards = [];

        for (const queryDocSnapUserBoard of querySnapUserBoards.docs) {
          userBoards.push(UserBoard.firestoreData(queryDocSnapUserBoard));
        }

        this.userBoards = userBoards;
      })
    });

    // board
    effect(() => {

      const boardId = this.getBoardId()();

      this.boardSub && !this.boardSub.closed && this.boardSub.unsubscribe();

      if (!boardId) {
        this.board = undefined;
        return;
      }

      this.loadingBoard = true;
      const boardRef = Board.firestoreRef(this._firestore, boardId);

      this.boardSub = docSnapshots(boardRef).pipe(
        map((docSnap) => Board.firestoreData(docSnap)),
        catchError((error) => {
          console.error(error);
          return of(null);
        }),
      ).subscribe((board) => {

        this.loadingBoard = false;
        this.firstLoadingBoard = false;

        if (!board) {
          this.board = null;
          return;
        }

        this.board = board;
      });
    });

    // boardStatuses
    effect(() => {

      const board = this.getBoard()();
      const user = this.userSig();

      this.boardStatusesSub && !this.boardStatusesSub.closed && this.boardStatusesSub.unsubscribe();

      if (!board || !user) {
        this.boardStatuses = undefined;
        return;
      }

      this.loadingBoardStatuses = true;
      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardStatusesRef = BoardStatus.firestoreCollectionRef(boardRef);

      this.boardStatusesSub = collectionSnapshots(boardStatusesRef, limit(user.config.maxBoardStatuses)).pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      ).subscribe((querySnapBoardStatuses) => {

        this.loadingBoardStatuses = false;
        this.firstLoadingBoardStatuses = false;

        if (!querySnapBoardStatuses) {
          this.boardStatuses = null;
          return;
        }

        const querySnapBoardStatusesMap = new Map<string, BoardStatus>();

        for (const queryDocSnapBoardStatus of querySnapBoardStatuses.docs) {
          querySnapBoardStatusesMap.set(queryDocSnapBoardStatus.id, BoardStatus.firestoreData(queryDocSnapBoardStatus));
        }

        this.boardStatuses = querySnapBoardStatusesMap;
      });
    });

    // boardTasks
    effect(() => {

      const board = this.getBoard()();
      const user = this.userSig();

      this.boardTasksSub && !this.boardTasksSub.closed && this.boardTasksSub.unsubscribe();

      if (!board || !user) {
        this.boardTasks = undefined;
        return;
      }

      this.loadingBoardTasks = true;
      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTasksRef = BoardTask.firestoreCollectionRef(boardRef);

      this.boardTasksSub = collectionSnapshots(boardTasksRef, limit(user.config.maxBoardTasks)).pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      ).subscribe((querySnapBoardTasks) => {

        this.loadingBoardTasks = false;
        this.firstLoadingBoardTasks = false;

        if (!querySnapBoardTasks) {
          this.boardTasks = null;
          return;
        }

        const querySnapUserBoardTasksMap = new Map<string, BoardTask>();

        for (const queryDocSnapBoardTask of querySnapBoardTasks.docs) {
          querySnapUserBoardTasksMap.set(queryDocSnapBoardTask.id, BoardTask.firestoreData(queryDocSnapBoardTask));
        }

        this.boardTasks = querySnapUserBoardTasksMap;
      });
    });

    // boardTask
    effect(() => {

      const boardTasks = this.getBoardTasks()();
      const boardTaskId = this.getBoardTaskId()();

      if (!boardTasks || !boardTaskId) {
        this.boardTask = undefined;
        return;
      }

      this.boardTask = boardTasks.get(boardTaskId) || null;
    });

    // boardTaskSubtasks
    effect(() => {

      const board = this.getBoard()();
      const boardTask = this.getBoardTask()();
      const user = this.userSig();

      this.boardTaskSubtasksSub && !this.boardTaskSubtasksSub.closed && this.boardTaskSubtasksSub.unsubscribe();

      if (!board || !boardTask || !user) {
        this.boardTaskSubtasks = undefined;
        return;
      }

      this.loadingBoardTaskSubtasks = true;

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTaskRef = BoardTask.firestoreRef(boardRef, boardTask.id);
      const boardTaskSubtasksRef = BoardTaskSubtask.firestoreRefs(boardTaskRef);

      this.boardTaskSubtasksSub = collectionSnapshots(boardTaskSubtasksRef, limit(user.config.maxBoardTaskSubtasks)).pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      ).subscribe((querySnapBoardTaskSubtasks) => {

        this.loadingBoardTaskSubtasks = false;
        this.firstLoadingBoardTaskSubtasks = false;

        if (!querySnapBoardTaskSubtasks) {
          this.boardTaskSubtasks = null;
          return;
        }

        const querySnapUserBoardTaskSubtasksMap = new Map<string, BoardTaskSubtask>();

        for (const queryDocSnapBoardTaskSubtask of querySnapBoardTaskSubtasks.docs) {
          querySnapUserBoardTaskSubtasksMap.set(queryDocSnapBoardTaskSubtask.id, BoardTaskSubtask.firestoreData(queryDocSnapBoardTaskSubtask));
        }

        this.boardTaskSubtasks = querySnapUserBoardTaskSubtasksMap;
      });
    });
  }

  boardCreate(data: BoardCreateData) {

    this.loadingUserBoards = true;

    return this._functionsService.httpsCallable<BoardCreateData, BoardCreateResult>('board-create', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been created', 3000);
      }),
      catchError((error) => {

        this.loadingUserBoards = false;

        throw error;
      })
    );
  }

  boardDelete(data: BoardDeleteData) {

    this.loadingUserBoards = true;

    return this._functionsService.httpsCallable<BoardDeleteData, BoardDeleteResult>('board-delete', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been deleted', 3000);
      }),
      catchError((error) => {
        this.loadingUserBoards = false;
        throw error;
      })
    );
  }

  boardUpdate(data: BoardUpdateData, boardNameWasChanged: boolean, boardStatusNameWasChanged: boolean, boardStatusAddedOrDeleted: boolean) {

    if (this.getBoardId()()) {
      if (boardNameWasChanged) {
        this.loadingBoard = true;
        this.loadingUserBoards = true;
      }

      if (boardStatusNameWasChanged || boardStatusAddedOrDeleted) {
        this.loadingBoardStatuses = true;
      }

      if (boardStatusAddedOrDeleted) {
        this.loadingBoardTasks = true;
      }
    }

    return this._functionsService.httpsCallable<BoardUpdateData, BoardUpdateResult>('board-update', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been updated', 3000);
      }),
      catchError((error) => {

        if (this.getBoardId()()) {
          if (boardNameWasChanged) {
            this.loadingBoard = false;
            this.loadingUserBoards = false;
          }

          if (boardStatusNameWasChanged || boardStatusAddedOrDeleted) {
            this.loadingBoardStatuses = false;
          }

          if (boardStatusAddedOrDeleted) {
            this.loadingBoardTasks = false;
          }
        }

        throw error;
      })
    );
  }

  boardTaskCreate(data: BoardTaskCreateData) {

    if (this.getBoardId()()) {
      this.loadingBoardTasks = true;
      this.loadingBoardStatuses = true;
    }

    return this._functionsService.httpsCallable<BoardTaskCreateData, BoardTaskCreateResult>('board-task-create', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been created', 3000);
      }),
      catchError((error) => {

        if (this.getBoardId()()) {
          this.loadingBoardTasks = false;
          this.loadingBoardStatuses = false;
        }

        throw error;
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData) {

    if (this.getBoardId()()) {
      this.loadingBoardTasks = true;
      this.loadingBoardStatuses = true;
    }

    return this._functionsService.httpsCallable<BoardTaskDeleteData, BoardTaskDeleteResult>('board-task-delete', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been deleted', 3000);
      }),
      catchError((error) => {

        if (this.getBoardId()()) {
          this.loadingBoardTasks = false;
          this.loadingBoardStatuses = false;
        }

        throw error;
      })
    );
  }

  boardTaskUpdate(data: BoardTaskUpdateData) {

    if (this.getBoardId()()) {
      this.loadingBoardTasks = true;
      this.loadingBoardStatuses = true;
    }

    return this._functionsService.httpsCallable<BoardTaskUpdateData, BoardTaskUpdateResult>('board-task-update', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been updated', 3000);
      }),
      catchError((error) => {

        if (this.getBoardId()()) {
          this.loadingBoardTasks = false;
          this.loadingBoardStatuses = false;
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
