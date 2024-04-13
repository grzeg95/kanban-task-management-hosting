import {Injectable} from '@angular/core';
import {DocumentReference, Firestore, limit, where} from '@angular/fire/firestore';
import {combineLatest, filter, map, Observable, of, switchMap, tap} from 'rxjs';
import {
  Board,
  BoardCreateData,
  BoardCreateResult,
  BoardDeleteData,
  BoardDeleteResult,
  BoardDoc,
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
import {BoardTaskSubtask, BoardTaskSubtaskDoc} from '../../models/board-task-subtask';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {AuthService} from '../auth/auth.service';
import {User} from '../auth/models/user';
import {UserBoard, UserBoardDoc} from '../auth/models/user-board';
import {collectionOnSnapshot, docOnSnapshot, updateDoc} from '../firebase/firestore';
import {FunctionsService} from '../firebase/functions.service';
import {BoardsServiceAbstract} from './boards-service.abstract';

@Injectable({
  providedIn: 'root'
})
export class FirebaseBoardsService extends BoardsServiceAbstract {

  override user$ = this._authService.user$.pipe(
    getProtectedRxjsPipe(),
    filter((user): user is User | null => !!user),
    tap(() => this.resetSelectingUser()),
    getProtectedRxjsPipe()
  );

  override userBoards$ = this.user$.pipe(
    switchMap((user) => {

      if (!user) {
        return of(null);
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
        })
      );
    }),
    tap(() => this.resetSelectingUserBoards()),
    getProtectedRxjsPipe()
  );

  override board$ = combineLatest([
    this.boardId$.pipe(getProtectedRxjsPipe()),
    this.user$
  ]).pipe(
    switchMap(([boardId, user]) => {

      if (!boardId || !user) {
        return of(null);
      }

      const boardRef = Board.ref(this._firestore, boardId);
      return docOnSnapshot(boardRef).pipe(
        map((boardSnap) => {

          if (!boardSnap.exists()) {
            return null;
          }

          return Board.data(boardSnap);
        }),
      );
    }),
    tap(() => this.resetSelectingBoard()),
    getProtectedRxjsPipe()
  );

  override boardStatuses$ = combineLatest([
    this.board$,
    this.user$
  ]).pipe(
    switchMap(([board, user]) => {

      if (!board || !user) {
        return of(null);
      }

      const boardRef = Board.ref(this._firestore, board.id);
      const boardStatusesRef = BoardStatus.collectionRef(boardRef);

      return collectionOnSnapshot(boardStatusesRef, limit(5)).pipe(
        map((querySnapBoardStatuses) => {

          const boardStatuses: {[key in string]: BoardStatus} = {};

          for (const querySnapDocBoardStatus of querySnapBoardStatuses.docs) {
            Object.assign(boardStatuses, {[querySnapDocBoardStatus.id]: BoardStatus.data(querySnapDocBoardStatus)});
          }

          return boardStatuses;
        })
      );
    }),
    tap(() => this.resetSelectingBoardStatuses()),
    getProtectedRxjsPipe()
  );

  override boardTasks$ = combineLatest([
    this.board$,
    this.user$
  ]).pipe(
    switchMap(([board, user]) => {

      if (!board || !user) {
        return of(null);
      }

      const boardRef = Board.ref(this._firestore, board.id);
      const boardTasksRef = BoardTask.collectionRef(boardRef);

      return collectionOnSnapshot(boardTasksRef, limit(20)).pipe(
        map((querySnapBoardTasks) => {

          const boardTasks: {[key in string]: BoardTask} = {};

          for (const querySnapDocBoardTask of querySnapBoardTasks.docs) {
            Object.assign(boardTasks, {[querySnapDocBoardTask.id]: BoardTask.data(querySnapDocBoardTask)});
          }

          return boardTasks;
        })
      );
    }),
    tap(() => this.resetSelectingBoardTasks()),
    getProtectedRxjsPipe()
  );

  constructor(
    private readonly _authService: AuthService,
    private readonly _firestore: Firestore,
    private readonly _functionsService: FunctionsService
  ) {
    super();
  }

  boardCreate(data: BoardCreateData): Observable<BoardCreateResult> {
    return this._functionsService.httpsCallable<BoardCreateData, BoardCreateResult>('board-create', data);
  }

  boardDelete(data: BoardDeleteData): Observable<BoardDeleteResult> {
    return this._functionsService.httpsCallable<BoardDeleteData, BoardDeleteResult>('board-delete', data);
  }

  boardUpdate(data: BoardUpdateData): Observable<BoardUpdateResult> {
    return this._functionsService.httpsCallable<BoardUpdateData, BoardUpdateResult>('board-update', data);
  }

  boardTaskCreate(data: BoardTaskCreateData): Observable<BoardTaskCreateResult> {
    return this._functionsService.httpsCallable<BoardTaskCreateData, BoardTaskCreateResult>('board-task-create', data);
  }

  boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult> {
    return this._functionsService.httpsCallable<BoardTaskDeleteData, BoardTaskDeleteResult>('board-task-delete', data);
  }

  boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult> {
    return this._functionsService.httpsCallable<BoardTaskUpdateData, BoardTaskUpdateResult>('board-task-update', data);
  }

  updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardTaskSubtaskRef: DocumentReference<BoardTaskSubtask, BoardTaskSubtaskDoc>) {
    return updateDoc(boardTaskSubtaskRef, {isCompleted});
  }
}
