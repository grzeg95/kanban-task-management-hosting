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
  boardStatuses$: Observable<{ [key in string]: BoardStatus } | null | undefined> | undefined;
  boardTask$: Observable<BoardTask | null | undefined> | undefined;
  boardTaskSubtasks$: Observable<{ [key in string]: BoardTaskSubtask } | null | undefined> | undefined;

  loadingUserBoards$: BehaviorSubject<boolean> | undefined;
  loadingBoard$: BehaviorSubject<boolean> | undefined;
  loadingBoardStatuses$: BehaviorSubject<boolean> | undefined;
  loadingBoardTasks$: BehaviorSubject<boolean> | undefined;
  loadingBoardTask$: BehaviorSubject<boolean> | undefined;
  loadingBoardTaskSubtasks$: BehaviorSubject<boolean> | undefined;

  firstLoadingUserBoards$: BehaviorSubject<boolean> | undefined;
  firstLoadingBoard$: BehaviorSubject<boolean> | undefined;
  firstLoadingBoardStatuses$: BehaviorSubject<boolean> | undefined;
  firstLoadingBoardTasks$: BehaviorSubject<boolean> | undefined;
  firstLoadingBoardTask$: BehaviorSubject<boolean> | undefined;
  firstLoadingBoardTaskSubtasks$: BehaviorSubject<boolean> | undefined;

  boardCreate(data: BoardCreateData): Observable<BoardCreateResult>;

  boardDelete(data: BoardDeleteData): Observable<BoardDeleteResult>;

  boardUpdate(data: BoardUpdateData, boardNameWasChanged: boolean, boardStatusWasChanged: boolean, boardStatusAddedOrDeleted: boolean): Observable<BoardUpdateResult>;

  boardTaskCreate(data: BoardTaskCreateData): Observable<BoardTaskCreateResult>;

  boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult>;

  boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult>;

  updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardId: string, boardTaskId: string, boardTaskSubtaskId: string): Observable<void>;
}

@Injectable()
export abstract class BoardServiceAbstract implements BoardServiceInterface {

  config$: Observable<Config | null | undefined> | undefined;

  readonly boardId$ = new BehaviorSubject<string | null | undefined>(undefined);
  readonly boardTaskId$ = new BehaviorSubject<string | null | undefined>(undefined);
  user$: Observable<User | null | undefined> | undefined;
  userBoards$: Observable<UserBoard[] | null | undefined> | undefined;
  board$: Observable<Board | null | undefined> | undefined;
  boardStatuses$: Observable<{ [key in string]: BoardStatus } | null | undefined> | undefined;
  boardTasks$: Observable<{ [key in string]: BoardTask } | null | undefined> | undefined;
  boardTask$: Observable<BoardTask | null | undefined> | undefined;
  boardTaskSubtasks$: Observable<{ [key in string]: BoardTaskSubtask } | null | undefined> | undefined;

  loadingUserBoards$ = new BehaviorSubject(false);
  loadingBoard$ = new BehaviorSubject(false);
  loadingBoardStatuses$ = new BehaviorSubject(false);
  loadingBoardTasks$ = new BehaviorSubject(false);
  loadingBoardTask$ = new BehaviorSubject(false);
  loadingBoardTaskSubtasks$ = new BehaviorSubject(false);

  firstLoadingUserBoards$ = new BehaviorSubject(true);
  firstLoadingBoard$ = new BehaviorSubject(true);
  firstLoadingBoardStatuses$ = new BehaviorSubject(true);
  firstLoadingBoardTasks$ = new BehaviorSubject(true);
  firstLoadingBoardTask$ = new BehaviorSubject(true);
  firstLoadingBoardTaskSubtasks$ = new BehaviorSubject(true);

  abstract boardCreate(data: BoardCreateData): Observable<BoardCreateResult>;

  abstract boardDelete(data: BoardDeleteData): Observable<BoardDeleteResult>;

  abstract boardUpdate(data: BoardUpdateData, boardNameWasChanged: boolean, boardStatusWasChanged: boolean, boardStatusAddedOrDeleted: boolean): Observable<BoardUpdateResult>;

  abstract boardTaskCreate(data: BoardTaskCreateData): Observable<BoardTaskCreateResult>;

  abstract boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult>;

  abstract boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult>;

  abstract updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardId: string, boardTaskId: string, boardTaskSubtaskId: string): Observable<void>;
}
