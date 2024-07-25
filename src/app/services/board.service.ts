import {effect, Inject, Injectable} from '@angular/core';
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
import {Sig} from '../utils/Sig';
import {AuthService} from './auth/auth.service';
import {collectionSnapshots, docSnapshots} from './firebase/firestore';
import {FunctionsService} from './firebase/functions.service';
import {SnackBarService} from './snack-bar.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  readonly user = this._authService.user.get();

  readonly boardId = new Sig<string | null | undefined>(null);
  readonly boardTaskId = new Sig<string | null>(null);

  readonly userBoards = new Sig<UserBoard[] | null | undefined>(undefined);
  userBoardsSub: Subscription | undefined;

  readonly board = new Sig<Board | null | undefined>(undefined);
  boardSub: Subscription | undefined;

  readonly boardStatuses = new Sig<Map<string, BoardStatus> | null | undefined>(undefined);
  boardStatusesSub: Subscription | undefined;

  readonly boardTasks = new Sig<Map<string, BoardTask> | null | undefined>(undefined);
  boardTasksSub: Subscription | undefined;

  readonly boardTask = new Sig<BoardTask | null | undefined>(undefined);

  readonly boardTaskSubtasks = new Sig<Map<string, BoardTaskSubtask> | null | undefined>(undefined);
  boardTaskSubtasksSub: Subscription | undefined;

  readonly loadingUserBoards = new Sig(false);
  readonly firstLoadingUserBoards = new Sig(true);
  readonly loadingBoard = new Sig(false);
  readonly firstLoadingBoard = new Sig(true);
  readonly loadingBoardStatuses = new Sig(false);
  readonly firstLoadingBoardStatuses = new Sig(true);
  readonly loadingBoardTasks = new Sig(false);
  readonly firstLoadingBoardTasks = new Sig(true);
  readonly loadingBoardTaskSubtasks = new Sig(false);
  readonly firstLoadingBoardTaskSubtasks = new Sig(true);

  constructor(
    private readonly _authService: AuthService,
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {

    // userBoards
    effect(() => {

      const user = this.user();

      this.userBoardsSub && !this.userBoardsSub.closed && this.userBoardsSub.unsubscribe();

      if (!user) {
        this.userBoards.set(undefined);
        return;
      }

      this.loadingUserBoards.set(true);
      const userBoardCollectionRef = UserBoard.firestoreCollectionRef(User.firestoreRef(this._firestore, user.id));

      this.userBoardsSub = collectionSnapshots(userBoardCollectionRef, limit(user.config.maxUserBoards)).pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      ).subscribe((querySnapUserBoards) => {

        this.loadingUserBoards.set(false);
        this.firstLoadingUserBoards.set(false);

        if (!querySnapUserBoards) {
          return;
        }

        const userBoards = [];

        for (const queryDocSnapUserBoard of querySnapUserBoards.docs) {
          userBoards.push(UserBoard.firestoreData(queryDocSnapUserBoard));
        }

        this.userBoards.set(userBoards);
      })
    });

    // board
    effect(() => {

      const boardId = this.boardId.get()();

      this.boardSub && !this.boardSub.closed && this.boardSub.unsubscribe();

      if (!boardId) {
        this.board.set(undefined);
        return;
      }

      this.loadingBoard.set(true);
      const boardRef = Board.firestoreRef(this._firestore, boardId);

      this.boardSub = docSnapshots(boardRef).pipe(
        map((docSnap) => Board.firestoreData(docSnap)),
        catchError((error) => {
          console.error(error);
          return of(null);
        }),
      ).subscribe((board) => {

        this.loadingBoard.set(false);
        this.firstLoadingBoard.set(false);

        if (!board) {
          this.board.set(null);
          return;
        }

        this.board.set(board);
      });
    });

    // boardStatuses
    effect(() => {

      const board = this.board.get()();
      const user = this.user();

      this.boardStatusesSub && !this.boardStatusesSub.closed && this.boardStatusesSub.unsubscribe();

      if (!board || !user) {
        this.boardStatuses.set(undefined);
        return;
      }

      this.loadingBoardStatuses.set(true);
      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardStatusesRef = BoardStatus.firestoreCollectionRef(boardRef);

      this.boardStatusesSub = collectionSnapshots(boardStatusesRef, limit(user.config.maxBoardStatuses)).pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      ).subscribe((querySnapBoardStatuses) => {

        this.loadingBoardStatuses.set(false);
        this.firstLoadingBoardStatuses.set(false);

        if (!querySnapBoardStatuses) {
          this.boardStatuses.set(null);
          return;
        }

        const querySnapBoardStatusesMap = new Map<string, BoardStatus>();

        for (const queryDocSnapBoardStatus of querySnapBoardStatuses.docs) {
          querySnapBoardStatusesMap.set(queryDocSnapBoardStatus.id, BoardStatus.firestoreData(queryDocSnapBoardStatus));
        }

        this.boardStatuses.set(querySnapBoardStatusesMap);
      });
    });

    // boardTasks
    effect(() => {

      const board = this.board.get()();
      const user = this.user();

      this.boardTasksSub && !this.boardTasksSub.closed && this.boardTasksSub.unsubscribe();

      if (!board || !user) {
        this.boardTasks.set(undefined);
        return;
      }

      this.loadingBoardTasks.set(true);
      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTasksRef = BoardTask.firestoreCollectionRef(boardRef);

      this.boardTasksSub = collectionSnapshots(boardTasksRef, limit(user.config.maxBoardTasks)).pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      ).subscribe((querySnapBoardTasks) => {

        this.loadingBoardTasks.set(false);
        this.firstLoadingBoardTasks.set(false);

        if (!querySnapBoardTasks) {
          this.boardTasks.set(null);
          return;
        }

        const querySnapUserBoardTasksMap = new Map<string, BoardTask>();

        for (const queryDocSnapBoardTask of querySnapBoardTasks.docs) {
          querySnapUserBoardTasksMap.set(queryDocSnapBoardTask.id, BoardTask.firestoreData(queryDocSnapBoardTask));
        }

        this.boardTasks.set(querySnapUserBoardTasksMap);
      });
    });

    // boardTask
    effect(() => {

      const boardTasks = this.boardTasks.get()();
      const boardTaskId = this.boardTaskId.get()();

      if (!boardTasks || !boardTaskId) {
        this.boardTask.set(undefined);
        return;
      }

      this.boardTask.set(boardTasks.get(boardTaskId) || null);
    });

    // boardTaskSubtasks
    effect(() => {

      const board = this.board.get()();
      const boardTask = this.boardTask.get()();
      const user = this.user();

      this.boardTaskSubtasksSub && !this.boardTaskSubtasksSub.closed && this.boardTaskSubtasksSub.unsubscribe();

      if (!board || !boardTask || !user) {
        this.boardTaskSubtasks.set(undefined);
        return;
      }

      this.loadingBoardTaskSubtasks.set(true);

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTaskRef = BoardTask.firestoreRef(boardRef, boardTask.id);
      const boardTaskSubtasksRef = BoardTaskSubtask.firestoreRefs(boardTaskRef);

      this.boardTaskSubtasksSub = collectionSnapshots(boardTaskSubtasksRef, limit(user.config.maxBoardTaskSubtasks)).pipe(
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      ).subscribe((querySnapBoardTaskSubtasks) => {

        this.loadingBoardTaskSubtasks.set(false);
        this.firstLoadingBoardTaskSubtasks.set(false);

        if (!querySnapBoardTaskSubtasks) {
          this.boardTaskSubtasks.set(null);
          return;
        }

        const querySnapUserBoardTaskSubtasksMap = new Map<string, BoardTaskSubtask>();

        for (const queryDocSnapBoardTaskSubtask of querySnapBoardTaskSubtasks.docs) {
          querySnapUserBoardTaskSubtasksMap.set(queryDocSnapBoardTaskSubtask.id, BoardTaskSubtask.firestoreData(queryDocSnapBoardTaskSubtask));
        }

        this.boardTaskSubtasks.set(querySnapUserBoardTaskSubtasksMap);
      });
    });
  }

  boardCreate(data: BoardCreateData) {

    this.loadingUserBoards.set(true);

    return this._functionsService.httpsCallable<BoardCreateData, BoardCreateResult>('board-create', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been created', 3000);
      }),
      catchError((error) => {

        this.loadingUserBoards.set(false);

        throw error;
      })
    );
  }

  boardDelete(data: BoardDeleteData) {

    this.loadingUserBoards.set(true);

    return this._functionsService.httpsCallable<BoardDeleteData, BoardDeleteResult>('board-delete', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been deleted', 3000);
      }),
      catchError((error) => {
        this.loadingUserBoards.set(false);
        throw error;
      })
    );
  }

  boardUpdate(data: BoardUpdateData, boardNameWasChanged: boolean, boardStatusNameWasChanged: boolean, boardStatusAddedOrDeleted: boolean) {

    if (this.boardId.get()()) {
      if (boardNameWasChanged) {
        this.loadingBoard.set(true);
        this.loadingUserBoards.set(true);
      }

      if (boardStatusNameWasChanged || boardStatusAddedOrDeleted) {
        this.loadingBoardStatuses.set(true);
      }

      if (boardStatusAddedOrDeleted) {
        this.loadingBoardTasks.set(true);
      }
    }

    return this._functionsService.httpsCallable<BoardUpdateData, BoardUpdateResult>('board-update', data).pipe(
      tap(() => {
        this._snackBarService.open('Board has been updated', 3000);
      }),
      catchError((error) => {

        if (this.boardId.get()()) {
          if (boardNameWasChanged) {
            this.loadingBoard.set(false);
            this.loadingUserBoards.set(false);
          }

          if (boardStatusNameWasChanged || boardStatusAddedOrDeleted) {
            this.loadingBoardStatuses.set(false);
          }

          if (boardStatusAddedOrDeleted) {
            this.loadingBoardTasks.set(false);
          }
        }

        throw error;
      })
    );
  }

  boardTaskCreate(data: BoardTaskCreateData) {

    if (this.boardId.get()()) {
      this.loadingBoardTasks.set(true);
      this.loadingBoardStatuses.set(true);
    }

    return this._functionsService.httpsCallable<BoardTaskCreateData, BoardTaskCreateResult>('board-task-create', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been created', 3000);
      }),
      catchError((error) => {

        if (this.boardId.get()()) {
          this.loadingBoardTasks.set(false);
          this.loadingBoardStatuses.set(false);
        }

        throw error;
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData) {

    if (this.boardId.get()()) {
      this.loadingBoardTasks.set(true);
      this.loadingBoardStatuses.set(true);
    }

    return this._functionsService.httpsCallable<BoardTaskDeleteData, BoardTaskDeleteResult>('board-task-delete', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been deleted', 3000);
      }),
      catchError((error) => {

        if (this.boardId.get()()) {
          this.loadingBoardTasks.set(false);
          this.loadingBoardStatuses.set(false);
        }

        throw error;
      })
    );
  }

  boardTaskUpdate(data: BoardTaskUpdateData) {

    if (this.boardId.get()()) {
      this.loadingBoardTasks.set(true);
      this.loadingBoardStatuses.set(true);
    }

    return this._functionsService.httpsCallable<BoardTaskUpdateData, BoardTaskUpdateResult>('board-task-update', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been updated', 3000);
      }),
      catchError((error) => {

        if (this.boardId.get()()) {
          this.loadingBoardTasks.set(false);
          this.loadingBoardStatuses.set(false);
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
