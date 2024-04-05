import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {
  Board,
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
import {User} from '../auth/user.model';

export type ObservedValuesOfBoardsService = 'boardId$' | 'user$' | 'board$' | 'selectingBoard$';

export interface BoardsServiceInterface {

  boardId$: BehaviorSubject<string | undefined>;
  board$: Observable<Board | null | undefined> | undefined;
  user$: Observable<User | null | undefined> | undefined;
  selectingBoard$: Observable<boolean> | undefined;

  resetSelectingOfBoard(): void;

  createBoard(data: CreateBoardData): Observable<CreateBoardResult>;

  deleteBoard(data: DeleteBoardData): Observable<DeleteBoardResult>;

  updateBoard(data: UpdateBoardData): Observable<UpdateBoardResult>;

  createTask(data: CreateTaskData): Observable<CreateTaskResult>;

  deleteTask(data: DeleteTaskData): Observable<DeleteTaskResult>;

  updateTask(data: UpdateTaskData): Observable<UpdateTaskResult>;
}

@Injectable()
export abstract class BoardsServiceTypes implements BoardsServiceInterface {

  readonly boardId$ = new BehaviorSubject<string | undefined>(undefined);
  board$: Observable<Board | null | undefined> | undefined;
  user$: Observable<User | null | undefined> | undefined;
  readonly selectingBoard$ = new BehaviorSubject(false);

  resetSelectingOfBoard() {
    setTimeout(() => {
      this.selectingBoard$.next(false);
    });
  }

  abstract createBoard(data: CreateBoardData): Observable<CreateBoardResult>;

  abstract deleteBoard(data: DeleteBoardData): Observable<DeleteBoardResult>;

  abstract updateBoard(data: UpdateBoardData): Observable<UpdateBoardResult>;

  abstract createTask(data: CreateTaskData): Observable<CreateTaskResult>;

  abstract deleteTask(data: DeleteTaskData): Observable<DeleteTaskResult>;

  abstract updateTask(data: UpdateTaskData): Observable<UpdateTaskResult>;

  clear() {
    this.resetSelectingOfBoard();
  }
}
