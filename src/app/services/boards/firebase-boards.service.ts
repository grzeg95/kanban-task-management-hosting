import {Injectable} from '@angular/core';
import {combineLatest, filter, map, Observable, of, switchMap} from 'rxjs';
import {
  Board,
  BoardDoc,
  CreateBoardData,
  CreateBoardResult,
  DeleteBoardData,
  DeleteBoardResult,
  UpdateBoardData,
  UpdateBoardResult
} from '../../models/board';
import {
  CreateTaskData,
  CreateTaskResult,
  DeleteTaskData,
  DeleteTaskResult,
  UpdateTaskData,
  UpdateTaskResult
} from '../../models/task';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {AuthService} from '../auth/auth.service';
import {User} from '../auth/user.model';
import {FirestoreService} from '../firebase/firestore.service';
import {FunctionsService} from '../firebase/functions.service';
import {BoardsServiceTypes} from './boards-service.types';

@Injectable({
  providedIn: 'root'
})
export class FirebaseBoardsService extends BoardsServiceTypes {

  override user$ = this._authService.user$.pipe(
    getProtectedRxjsPipe(),
    filter((user): user is User | null => !!user)
  );

  override board$ = combineLatest([
    this.boardId$.pipe(getProtectedRxjsPipe()),
    this.user$
  ]).pipe(
    switchMap(([boardId, user]) => {

      if (!boardId || !user) {
        return of(null);
      }

      return this._firestoreService.docOnSnapshot<BoardDoc>(`/users/${user.id}/boards/${boardId}`).pipe(
        map((boardDocSnap) => {

          if (!boardDocSnap.exists()) {
            this.resetSelectingOfBoard();
            return null;
          }

          const board: Board = {
            ...boardDocSnap.data()!,
            id: boardDocSnap.id
          };

          this.resetSelectingOfBoard();
          return board;
        })
      );
    }),
    getProtectedRxjsPipe()
  );

  constructor(
    private readonly _authService: AuthService,
    private readonly _firestoreService: FirestoreService,
    private readonly _functionsService: FunctionsService
  ) {
    super();
  }

  createBoard(data: CreateBoardData): Observable<CreateBoardResult> {
    return this._functionsService.httpsCallable<CreateBoardData, CreateBoardResult>('board-create', data);
  }

  deleteBoard(data: DeleteBoardData): Observable<DeleteBoardResult> {
    return this._functionsService.httpsCallable<DeleteBoardData, DeleteBoardResult>('board-delete', data);
  }

  updateBoard(data: UpdateBoardData): Observable<UpdateBoardResult> {
    return this._functionsService.httpsCallable<UpdateBoardData, UpdateBoardResult>('board-update', data);
  }

  createTask(data: CreateTaskData): Observable<CreateTaskResult> {
    return this._functionsService.httpsCallable<CreateTaskData, CreateTaskResult>('task-create', data);
  }

  deleteTask(data: DeleteTaskData): Observable<DeleteTaskResult> {
    return this._functionsService.httpsCallable<DeleteTaskData, DeleteTaskResult>('task-delete', data);
  }

  updateTask(data: UpdateTaskData): Observable<UpdateTaskResult> {
    return this._functionsService.httpsCallable<UpdateTaskData, UpdateTaskResult>('task-update', data);
  }

  updateDoc(path: string, data: any): Observable<void> {
    return this._firestoreService.updateDoc(path, data);
  }
}
