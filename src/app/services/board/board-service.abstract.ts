import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
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
import {User} from '../auth/models/user';
import {UserBoard} from '../auth/models/user-board';

export type ObservedValuesOfBoardService =
  'boardId$'
  | 'user$'
  | 'userBoards$'
  | 'board$'
  | 'boardStatuses$'
  | 'boardTasks$'
  | 'boardTask$'
  | 'boardTaskSubtasks$'
  | 'selectingUser$'
  | 'selectingUserBoards$'
  | 'selectingBoard$'
  | 'selectingBoardStatuses$'
  | 'selectingBoardTasks$'
  | 'selectingBoardTask$'
  | 'selectingBoardTaskSubtasks$';

export interface BoardServiceInterface {

  boardId$: BehaviorSubject<string | null | undefined>;
  user$: Observable<User | null | undefined> | undefined;
  userBoards$: Observable<UserBoard[] | null | undefined> | undefined;
  board$: Observable<Board | null | undefined> | undefined;
  boardStatuses$: Observable<{ [key in string]: BoardStatus } | null | undefined> | undefined;
  boardTask$: Observable<BoardTask | null | undefined> | undefined;
  boardTaskSubtasks$: Observable<{ [key in string]: BoardTaskSubtask } | null | undefined> | undefined;

  selectingUser$: BehaviorSubject<boolean>;
  selectingUserBoards$: BehaviorSubject<boolean>;
  selectingBoard$: BehaviorSubject<boolean>;
  selectingBoardStatuses$: BehaviorSubject<boolean>;
  selectingBoardTasks$: BehaviorSubject<boolean>;
  selectingBoardTask$: BehaviorSubject<boolean>;
  selectingBoardTaskSubtasks$: BehaviorSubject<boolean>;

  resetSelectingUser(): void;

  resetSelectingUserBoards(): void;

  resetSelectingBoard(): void;

  resetSelectingBoardStatuses(): void;

  resetSelectingBoardTasks(): void;

  resetSelectingBoardTask(): void;

  resetSelectingBoardTaskSubtasks(): void;

  boardCreate(data: BoardCreateData): Observable<BoardCreateResult>;

  boardDelete(data: BoardDeleteData): Observable<BoardDeleteResult>;

  boardUpdate(data: BoardUpdateData): Observable<BoardUpdateResult>;

  boardTaskCreate(data: BoardTaskCreateData): Observable<BoardTaskCreateResult>;

  boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult>;

  boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult>;

  updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, ...ref: any): Observable<void>;
}

@Injectable()
export abstract class BoardServiceAbstract implements BoardServiceInterface {

  readonly boardId$ = new BehaviorSubject<string | null | undefined>(undefined);
  readonly boardTaskId$ = new BehaviorSubject<string | undefined>(undefined);
  user$: Observable<User | null | undefined> | undefined;
  userBoards$: Observable<UserBoard[] | null | undefined> | undefined;
  board$: Observable<Board | null | undefined> | undefined;
  boardStatuses$: Observable<{ [key in string]: BoardStatus } | null | undefined> | undefined;
  boardTasks$: Observable<{ [key in string]: BoardTask } | null | undefined> | undefined;
  boardTask$: Observable<BoardTask | null | undefined> | undefined;
  boardTaskSubtasks$: Observable<{ [key in string]: BoardTaskSubtask } | null | undefined> | undefined;

  readonly selectingUser$ = new BehaviorSubject(false);
  readonly selectingUserBoards$ = new BehaviorSubject(false);
  readonly selectingBoard$ = new BehaviorSubject(false);
  readonly selectingBoardStatuses$ = new BehaviorSubject(false);
  readonly selectingBoardTasks$ = new BehaviorSubject(false);
  readonly selectingBoardTask$ = new BehaviorSubject(false);
  readonly selectingBoardTaskSubtasks$ = new BehaviorSubject(false);

  private _resetSelecting(behaviorSubject: BehaviorSubject<boolean>) {
    setTimeout(() => behaviorSubject.next(false));
  }

  readonly resetSelectingUser = () => this._resetSelecting(this.selectingUser$);
  readonly resetSelectingUserBoards = () => this._resetSelecting(this.selectingUserBoards$);
  readonly resetSelectingBoard = () => this._resetSelecting(this.selectingBoard$);
  readonly resetSelectingBoardStatuses = () => this._resetSelecting(this.selectingBoardStatuses$);
  readonly resetSelectingBoardTasks = () => this._resetSelecting(this.selectingBoardTasks$);
  readonly resetSelectingBoardTask = () => this._resetSelecting(this.selectingBoardTask$);
  readonly resetSelectingBoardTaskSubtasks = () => this._resetSelecting(this.selectingBoardTaskSubtasks$);

  abstract boardCreate(data: BoardCreateData): Observable<BoardCreateResult>;

  abstract boardDelete(data: BoardDeleteData): Observable<BoardDeleteResult>;

  abstract boardUpdate(data: BoardUpdateData): Observable<BoardUpdateResult>;

  abstract boardTaskCreate(data: BoardTaskCreateData): Observable<BoardTaskCreateResult>;

  abstract boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult>;

  abstract boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult>;

  abstract updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, ...ref: any): Observable<void>;
}
