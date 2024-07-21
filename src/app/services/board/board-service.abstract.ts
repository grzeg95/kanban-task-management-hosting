import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, map, Observable, of} from 'rxjs';
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

export type ObservedValuesOfBoardService =
  | 'config$'
  | 'boardId$'
  | 'user$'
  | 'userBoards$'
  | 'board$'
  | 'boardStatuses$'
  | 'boardTasks$'
  | 'boardTask$'
  | 'boardTaskSubtasks$'
  | 'loadingUserBoards$'
  | 'loadingBoard$'
  | 'loadingBoardStatuses$'
  | 'loadingBoardTasks$'
  | 'loadingBoardTask$'
  | 'loadingBoardTaskSubtasks$'
  | 'firstLoadingUserBoards$'
  | 'firstLoadingBoard$'
  | 'firstLoadingBoardStatuses$'
  | 'firstLoadingBoardTasks$'
  | 'firstLoadingBoardTask$'
  | 'firstLoadingBoardTaskSubtasks$';

export interface BoardServiceInterface {

  config$: Observable<Config | null | undefined> | undefined;

  boardId$: BehaviorSubject<string | null | undefined>;
  boardTaskId$: BehaviorSubject<string | null | undefined> | undefined;
  user$: Observable<User | null | undefined> | undefined;
  userBoards$: Observable<UserBoard[] | null | undefined> | undefined;
  board$: Observable<Board | null | undefined> | undefined;
  boardStatuses$: Observable<Map<string, BoardStatus> | null | undefined> | undefined;
  boardTasks$: Observable<Map<string, BoardTask> | null | undefined> | undefined;
  boardTask$: Observable<BoardTask | null | undefined> | undefined;
  boardTaskSubtasks$: Observable<Map<string, BoardTaskSubtask> | null | undefined> | undefined;

  loadingUserBoards$: Observable<boolean>;
  _loadingUserBoardsUpdate$: Observable<boolean>;
  loadingBoard$: Observable<boolean>;
  _loadingBoardUpdate$: Observable<boolean>;
  loadingBoardStatuses$: Observable<boolean>;
  _loadingBoardStatusesUpdate$: Observable<boolean>;
  loadingBoardTasks$: Observable<boolean>;
  _loadingBoardTasksUpdate$: Observable<boolean>;
  loadingBoardTask$: Observable<boolean>;
  _loadingBoardTaskUpdate$: Observable<boolean>;
  loadingBoardTaskSubtasks$: Observable<boolean>;
  _loadingBoardTaskSubtasksUpdate$: Observable<boolean>;

  firstLoadingUserBoards$: Observable<boolean>;
  _firstLoadingUserBoardsUpdate$: Observable<boolean>;
  firstLoadingBoard$: Observable<boolean>;
  _firstLoadingBoardUpdate$: Observable<boolean>;
  firstLoadingBoardStatuses$: Observable<boolean>;
  _firstLoadingBoardStatusesUpdate$: Observable<boolean>;
  firstLoadingBoardTasks$: Observable<boolean>;
  _firstLoadingBoardTasksUpdate$: Observable<boolean>;
  firstLoadingBoardTask$: Observable<boolean>;
  _firstLoadingBoardTaskUpdate$: Observable<boolean>;
  firstLoadingBoardTaskSubtasks$: Observable<boolean>;
  _firstLoadingBoardTaskSubtasksUpdate$: Observable<boolean>;

  boardCreate(data: BoardCreateData): Observable<BoardCreateResult>;

  boardDelete(data: BoardDeleteData): Observable<BoardDeleteResult>;

  boardUpdate(data: BoardUpdateData, boardNameWasChanged: boolean, boardStatusWasChanged: boolean, boardStatusAddedOrDeleted: boolean): Observable<BoardUpdateResult>;

  boardTaskCreate(data: BoardTaskCreateData): Observable<BoardTaskCreateResult>;

  boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult>;

  boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult>;

  updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardId: string, boardTaskId: string, boardTaskSubtaskId: string): Observable<void>;

  firstLoadingUserBoardsUpdate(val: boolean): void;

  loadingUserBoardsUpdate(val: boolean): void;

  firstLoadingBoardUpdate(val: boolean): void;

  loadingBoardUpdate(val: boolean): void;

  firstLoadingBoardStatusesUpdate(val: boolean): void;

  loadingBoardStatusesUpdate(val: boolean): void;

  firstLoadingBoardTasksUpdate(val: boolean): void;

  loadingBoardTasksUpdate(val: boolean): void;

  firstLoadingBoardTaskUpdate(val: boolean): void;

  loadingBoardTaskUpdate(val: boolean): void;

  firstLoadingBoardTaskSubtasksUpdate(val: boolean): void;

  loadingBoardTaskSubtasksUpdate(val: boolean): void;
}

@Injectable()
export abstract class BoardServiceAbstract implements BoardServiceInterface {

  config$: Observable<Config | null | undefined> | undefined;

  readonly boardId$ = new BehaviorSubject<string | null | undefined>(undefined);
  readonly boardTaskId$ = new BehaviorSubject<string | null | undefined>(undefined);
  user$: Observable<User | null | undefined> | undefined;
  userBoards$: Observable<UserBoard[] | null | undefined> | undefined;
  board$: Observable<Board | null | undefined> | undefined;
  boardStatuses$: Observable<Map<string, BoardStatus> | null | undefined> | undefined;
  boardTasks$: Observable<Map<string, BoardTask> | null | undefined> | undefined;
  boardTask$: Observable<BoardTask | null | undefined> | undefined;
  boardTaskSubtasks$: Observable<Map<string, BoardTaskSubtask> | null | undefined> | undefined;

  _loadingUserBoardsUpdate$ = new BehaviorSubject(false);
  _firstLoadingUserBoardsUpdate$ = new BehaviorSubject(true);
  firstLoadingUserBoards$ = this._firstLoadingUserBoardsUpdate$.asObservable();
  loadingUserBoards$ = combineLatest([
    this._loadingUserBoardsUpdate$,
    ((this!.userBoards$! || of(undefined)).pipe(map((val) => !!val)))
  ]).pipe(
    map((values) => values.every((val) => !!val))
  );

  _loadingBoardUpdate$ = new BehaviorSubject(false);
  _firstLoadingBoardUpdate$ = new BehaviorSubject(true);
  firstLoadingBoard$ = this._firstLoadingBoardUpdate$.asObservable();
  loadingBoard$ = combineLatest([
    this._loadingUserBoardsUpdate$,
    ((this!.board$! || of(undefined)).pipe(map((val) => !!val)))
  ]).pipe(
    map((values) => values.every((val) => !!val))
  );

  _loadingBoardStatusesUpdate$ = new BehaviorSubject(false);
  _firstLoadingBoardStatusesUpdate$ = new BehaviorSubject(true);
  firstLoadingBoardStatuses$ = this._firstLoadingBoardStatusesUpdate$.asObservable();
  loadingBoardStatuses$ = combineLatest([
    this._loadingBoardStatusesUpdate$,
    ((this!.boardStatuses$! || of(undefined)).pipe(map((val) => !!val)))
  ]).pipe(
    map((values) => values.every((val) => !!val))
  );

  _loadingBoardTasksUpdate$ = new BehaviorSubject(false);
  _firstLoadingBoardTasksUpdate$ = new BehaviorSubject(true);
  firstLoadingBoardTasks$ = this._firstLoadingBoardTasksUpdate$.asObservable();
  loadingBoardTasks$ = combineLatest([
    this._loadingBoardTasksUpdate$,
    ((this!.boardTasks$! || of(undefined)).pipe(map((val) => !!val)))
  ]).pipe(
    map((values) => values.every((val) => !!val))
  );

  _loadingBoardTaskUpdate$ = new BehaviorSubject(false);
  _firstLoadingBoardTaskUpdate$ = new BehaviorSubject(true);
  firstLoadingBoardTask$ = this._firstLoadingBoardTaskUpdate$.asObservable();
  loadingBoardTask$ = combineLatest([
    this._loadingBoardTaskUpdate$,
    ((this!.boardTask$! || of(undefined)).pipe(map((val) => !!val)))
  ]).pipe(
    map((values) => values.every((val) => !!val))
  );

  _loadingBoardTaskSubtasksUpdate$ = new BehaviorSubject(false);
  _firstLoadingBoardTaskSubtasksUpdate$ = new BehaviorSubject(true);
  firstLoadingBoardTaskSubtasks$ = this._firstLoadingBoardTaskSubtasksUpdate$.asObservable();
  loadingBoardTaskSubtasks$ = combineLatest([
    this._loadingBoardTaskSubtasksUpdate$,
    ((this!.boardTaskSubtasks$! || of(undefined)).pipe(map((val) => !!val)))
  ]).pipe(
    map((values) => values.every((val) => !!val))
  );

  abstract boardCreate(data: BoardCreateData): Observable<BoardCreateResult>;

  abstract boardDelete(data: BoardDeleteData): Observable<BoardDeleteResult>;

  abstract boardUpdate(data: BoardUpdateData, boardNameWasChanged: boolean, boardStatusWasChanged: boolean, boardStatusAddedOrDeleted: boolean): Observable<BoardUpdateResult>;

  abstract boardTaskCreate(data: BoardTaskCreateData): Observable<BoardTaskCreateResult>;

  abstract boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult>;

  abstract boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult>;

  abstract updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardId: string, boardTaskId: string, boardTaskSubtaskId: string): Observable<void>;

  firstLoadingUserBoardsUpdate(val: boolean) {
    this._firstLoadingUserBoardsUpdate$.next(val);
  }

  loadingUserBoardsUpdate(val: boolean) {
    this._loadingUserBoardsUpdate$.next(val);
  }

  firstLoadingBoardUpdate(val: boolean) {
    this._firstLoadingBoardUpdate$.next(val);
  }

  loadingBoardUpdate(val: boolean) {
    this._loadingBoardUpdate$.next(val);
  }

  firstLoadingBoardStatusesUpdate(val: boolean) {
    this._firstLoadingBoardStatusesUpdate$.next(val);
  }

  loadingBoardStatusesUpdate(val: boolean) {
    this._loadingBoardStatusesUpdate$.next(val);
  }

  firstLoadingBoardTasksUpdate(val: boolean) {
    this._firstLoadingBoardTasksUpdate$.next(val);
  }

  loadingBoardTasksUpdate(val: boolean) {
    this._loadingBoardTasksUpdate$.next(val);
  }

  firstLoadingBoardTaskUpdate(val: boolean) {
    this._firstLoadingBoardTaskUpdate$.next(val);
  }

  loadingBoardTaskUpdate(val: boolean) {
    this._loadingBoardTaskUpdate$.next(val);
  }

  firstLoadingBoardTaskSubtasksUpdate(val: boolean) {
    this._firstLoadingBoardTaskSubtasksUpdate$.next(val);
  }

  loadingBoardTaskSubtasksUpdate(val: boolean) {
    this._loadingBoardTaskSubtasksUpdate$.next(val);
  }
}
