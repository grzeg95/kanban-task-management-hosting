import {effect, Injectable, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {collectionSnapshots, docSnapshots, Firestore, limit, query, updateDoc} from '@angular/fire/firestore';
import {catchError, defer, map, of, shareReplay, Subscription, tap} from 'rxjs';
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
import {AuthService} from '../auth/auth.service';
import {FunctionsService} from '../firebase/functions.service';
import {SnackBarService} from '../snack-bar.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  readonly boardId = signal<string | null | undefined>(null);
  readonly boardTaskId = signal<string | null>(null);
  readonly user = toSignal(this._authService.user$);

  readonly config = toSignal(
    docSnapshots(Config.firestoreRef(this._firestore, 'global')).pipe(
      map((docSnap) => Config.firestoreData(docSnap)),
      catchError(() => of(null)),
      shareReplay()
    )
  );

  readonly userBoards = signal<UserBoard[] | null | undefined>(undefined);
  userBoardsSub: Subscription | undefined;

  readonly board = signal<Board | null | undefined>(undefined);
  boardSub: Subscription | undefined;

  readonly boardStatuses = signal<Map<string, BoardStatus> | null | undefined>(undefined);
  boardStatusesSub: Subscription | undefined;

  readonly boardTasks = signal<Map<string, BoardTask> | null | undefined>(undefined);
  boardTasksSub: Subscription | undefined;

  readonly boardTask = signal<BoardTask | null | undefined>(undefined);

  readonly boardTaskSubtasks = signal<Map<string, BoardTaskSubtask> | null | undefined>(undefined);
  boardTaskSubtasksSub: Subscription | undefined;

  readonly loadingUserBoards = signal(false);
  readonly firstLoadingUserBoards = signal(true);

  readonly loadingBoard = signal(false);
  readonly firstLoadingBoard = signal(true);

  readonly loadingBoardStatuses = signal(false);
  readonly firstLoadingBoardStatuses = signal(true);

  readonly loadingBoardTasks = signal(false);
  readonly firstLoadingBoardTasks = signal(true);

  readonly loadingBoardTaskSubtasks = signal(false);
  readonly firstLoadingBoardTaskSubtasks = signal(true);

  constructor(
    private readonly _authService: AuthService,
    private readonly _firestore: Firestore,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {

    // userBoards
    effect(() => {

      const config = this.config();
      const user = this.user();

      this.userBoardsSub && !this.userBoardsSub.closed && this.userBoardsSub.unsubscribe();

      if (!config || !user) {
        this.userBoards.set(undefined);
        return;
      }

      this.loadingUserBoards.set(true);
      const userBoardCollectionRef = UserBoard.firestoreCollectionRef(User.firestoreRef(this._firestore, user.id));

      this.userBoardsSub = collectionSnapshots(query(userBoardCollectionRef, limit(config.maxUserBoards))).pipe(
        catchError(() => of(null))
      ).subscribe((querySnapUserBoards) => {

        if (!querySnapUserBoards) {
          return;
        }

        const userBoards = [];

        for (const queryDocSnapUserBoard of querySnapUserBoards) {
          userBoards.push(UserBoard.firestoreData(queryDocSnapUserBoard));
        }

        this.loadingUserBoards.set(false);
        this.firstLoadingUserBoards.set(false);

        this.userBoards.set(userBoards);
      })
    }, {allowSignalWrites: true});

    // board
    effect(() => {

      const boardId = this.boardId();

      this.boardSub && !this.boardSub.closed && this.boardSub.unsubscribe();

      if (!boardId) {
        this.board.set(undefined);
        return;
      }

      this.loadingBoard.set(true);
      const boardRef = Board.firestoreRef(this._firestore, boardId);

      this.boardSub = docSnapshots(boardRef).pipe(
        catchError(() => of(null))
      ).subscribe((boardSnap) => {

        if (!boardSnap || !boardSnap.exists()) {
          this.board.set(null);
          return;
        }

        const board = Board.firestoreData(boardSnap);

        this.loadingBoard.set(false);
        this.firstLoadingBoard.set(false);

        this.board.set(board);
      });
    }, {allowSignalWrites: true});

    // boardStatuses
    effect(() => {

      const board = this.board();
      const config = this.config();

      this.boardStatusesSub && !this.boardStatusesSub.closed && this.boardStatusesSub.unsubscribe();

      if (!board || !config) {
        this.boardStatuses.set(undefined);
        return;
      }

      this.loadingBoardStatuses.set(true);
      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardStatusesRef = BoardStatus.firestoreCollectionRef(boardRef);

      this.boardStatusesSub = collectionSnapshots(query(boardStatusesRef, limit(config.maxBoardStatuses))).pipe(
        catchError(() => of(null))
      ).subscribe((querySnapBoardStatuses) => {

        if (!querySnapBoardStatuses) {
          this.boardStatuses.set(null);
          return;
        }

        const querySnapBoardStatusesMap = new Map<string, BoardStatus>();

        for (const queryDocSnapBoardStatus of querySnapBoardStatuses) {
          querySnapBoardStatusesMap.set(queryDocSnapBoardStatus.id, BoardStatus.firestoreData(queryDocSnapBoardStatus));
        }

        this.loadingBoardStatuses.set(false);
        this.firstLoadingBoardStatuses.set(false);

        this.boardStatuses.set(querySnapBoardStatusesMap);
      });
    }, {allowSignalWrites: true});

    // boardTasks
    effect(() => {

      const board = this.board();
      const config = this.config();

      this.boardStatusesSub && !this.boardStatusesSub.closed && this.boardStatusesSub.unsubscribe();

      if (!board || !config) {
        this.boardTasks.set(undefined);
        return;
      }

      this.loadingBoardTasks.set(true);
      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTasksRef = BoardTask.firestoreCollectionRef(boardRef);

      this.boardStatusesSub = collectionSnapshots(query(boardTasksRef, limit(config.maxBoardTasks))).pipe(
        catchError(() => of(null))
      ).subscribe((querySnapBoardTasks) => {

        if (!querySnapBoardTasks) {
          this.boardTasks.set(null);
          return;
        }

        const querySnapUserBoardTasksMap = new Map<string, BoardTask>();

        for (const queryDocSnapBoardTask of querySnapBoardTasks) {
          querySnapUserBoardTasksMap.set(queryDocSnapBoardTask.id, BoardTask.firestoreData(queryDocSnapBoardTask));
        }

        this.loadingBoardTasks.set(false);
        this.firstLoadingBoardTasks.set(false);

        this.boardTasks.set(querySnapUserBoardTasksMap);
      });
    }, {allowSignalWrites: true});

    // boardTask
    effect(() => {

      const boardTasks = this.boardTasks();
      const boardTaskId = this.boardTaskId();

      this.boardTasksSub && !this.boardTasksSub.closed && this.boardTasksSub.unsubscribe();

      if (!boardTasks || !boardTaskId) {
        this.boardTask.set(undefined);
        return;
      }

      return boardTasks.get(boardTaskId) || null;

    }, {allowSignalWrites: true});

    // boardTaskSubtasks
    effect(() => {

      const board = this.board();
      const boardTask = this.boardTask();
      const config = this.config();

      this.boardTaskSubtasksSub && !this.boardTaskSubtasksSub.closed && this.boardTaskSubtasksSub.unsubscribe();

      if (!board || !boardTask || !config) {
        this.boardTaskSubtasks.set(undefined);
        return;
      }

      this.loadingBoardTaskSubtasks.set(true);

      const boardRef = Board.firestoreRef(this._firestore, board.id);
      const boardTaskRef = BoardTask.firestoreRef(boardRef, boardTask.id);
      const boardTaskSubtasksRef = BoardTaskSubtask.firestoreRefs(boardTaskRef);

      this.boardTaskSubtasksSub = collectionSnapshots<BoardTaskSubtask>(query(boardTaskSubtasksRef, limit(config.maxBoardTaskSubtasks))).pipe(
        catchError(() => of(null))
      ).subscribe((querySnapBoardTaskSubtasks) => {

        if (!querySnapBoardTaskSubtasks) {
          this.boardTaskSubtasks.set(null);
          return;
        }

        const querySnapUserBoardTaskSubtasksMap = new Map<string, BoardTaskSubtask>();

        for (const queryDocSnapBoardTaskSubtask of querySnapBoardTaskSubtasks) {
          querySnapUserBoardTaskSubtasksMap.set(queryDocSnapBoardTaskSubtask.id, BoardTaskSubtask.firestoreData(queryDocSnapBoardTaskSubtask));
        }

        this.loadingBoardTaskSubtasks.set(false);
        this.firstLoadingBoardTaskSubtasks.set(false);

        this.boardTaskSubtasks.set(querySnapUserBoardTaskSubtasksMap);
      });
    }, {allowSignalWrites: true});
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

    if (this.boardId()) {
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

        if (this.boardId()) {
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

    if (this.boardId()) {
      this.loadingBoardTasks.set(true);
      this.loadingBoardStatuses.set(true);
    }

    return this._functionsService.httpsCallable<BoardTaskCreateData, BoardTaskCreateResult>('board-task-create', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been created', 3000);
      }),
      catchError((error) => {

        if (this.boardId()) {
          this.loadingBoardTasks.set(false);
          this.loadingBoardStatuses.set(false);
        }

        throw error;
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData) {

    if (this.boardId()) {
      this.loadingBoardTasks.set(true);
      this.loadingBoardStatuses.set(true);
    }

    return this._functionsService.httpsCallable<BoardTaskDeleteData, BoardTaskDeleteResult>('board-task-delete', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been deleted', 3000);
      }),
      catchError((error) => {

        if (this.boardId()) {
          this.loadingBoardTasks.set(false);
          this.loadingBoardStatuses.set(false);
        }

        throw error;
      })
    );
  }

  boardTaskUpdate(data: BoardTaskUpdateData) {

    if (this.boardId()) {
      this.loadingBoardTasks.set(true);
      this.loadingBoardStatuses.set(true);
    }

    return this._functionsService.httpsCallable<BoardTaskUpdateData, BoardTaskUpdateResult>('board-task-update', data).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been updated', 3000);
      }),
      catchError((error) => {

        if (this.boardId()) {
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
