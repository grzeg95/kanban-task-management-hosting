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
import {User} from '../../models/user';
import {UserBoard} from '../../models/user-board';

export type ObservedValuesOfBoardService =
  | 'boardId$'
  | 'user$'
  | 'userBoards$'
  | 'board$'
  // | 'darkMode$'
  | 'boardStatuses$'
  | 'boardTasks$'
  | 'boardTask$'
  | 'boardTaskSubtasks$'
  | 'loadingUser$'
  | 'loadingUserBoards$'
  | 'loadingBoard$'
  | 'loadingBoardStatuses$'
  | 'loadingBoardTasks$'
  | 'loadingBoardTask$'
  | 'loadingBoardTaskSubtasks$';

export interface BoardServiceInterface {

  boardId$: BehaviorSubject<string | null | undefined>;
  boardTaskId$: BehaviorSubject<string | null | undefined> | undefined;
  user$: Observable<User | null | undefined> | undefined;
  userBoards$: Observable<UserBoard[] | null | undefined> | undefined;
  board$: Observable<Board | null | undefined> | undefined;
  boardStatuses$: Observable<{ [key in string]: BoardStatus } | null | undefined> | undefined;
  boardTask$: Observable<BoardTask | null | undefined> | undefined;
  boardTaskSubtasks$: Observable<{ [key in string]: BoardTaskSubtask } | null | undefined> | undefined;

  loadingUser$: Observable<boolean> | undefined;
  loadingUserBoards$: Observable<boolean> | undefined;
  loadingBoard$: Observable<boolean> | undefined;
  loadingBoardStatuses$: Observable<boolean> | undefined;
  loadingBoardTasks$: Observable<boolean> | undefined;
  loadingBoardTask$: Observable<boolean> | undefined;
  loadingBoardTaskSubtasks$: Observable<boolean> | undefined;

  boardCreate(data: BoardCreateData): Observable<BoardCreateResult>;

  boardDelete(data: BoardDeleteData): Observable<BoardDeleteResult>;

  boardUpdate(data: BoardUpdateData): Observable<BoardUpdateResult>;

  boardTaskCreate(data: BoardTaskCreateData): Observable<BoardTaskCreateResult>;

  boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult>;

  boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult>;

  updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardId: string, boardTaskId: string, boardTaskSubtaskId: string): Observable<void>;
}

@Injectable()
export abstract class BoardServiceAbstract implements BoardServiceInterface {

  readonly boardId$ = new BehaviorSubject<string | null | undefined>(undefined);
  readonly boardTaskId$ = new BehaviorSubject<string | null | undefined>(undefined);
  user$: Observable<User | null | undefined> | undefined;
  userBoards$: Observable<UserBoard[] | null | undefined> | undefined;
  board$: Observable<Board | null | undefined> | undefined;
  boardStatuses$: Observable<{ [key in string]: BoardStatus } | null | undefined> | undefined;
  boardTasks$: Observable<{ [key in string]: BoardTask } | null | undefined> | undefined;
  boardTask$: Observable<BoardTask | null | undefined> | undefined;
  boardTaskSubtasks$: Observable<{ [key in string]: BoardTaskSubtask } | null | undefined> | undefined;

  loadingUser$: Observable<boolean> | undefined;
  loadingUserBoards$: Observable<boolean> | undefined;
  loadingBoard$: Observable<boolean> | undefined;
  loadingBoardStatuses$: Observable<boolean> | undefined;
  loadingBoardTasks$: Observable<boolean> | undefined;
  loadingBoardTask$: Observable<boolean> | undefined;
  loadingBoardTaskSubtasks$: Observable<boolean> | undefined;

  abstract boardCreate(data: BoardCreateData): Observable<BoardCreateResult>;

  abstract boardDelete(data: BoardDeleteData): Observable<BoardDeleteResult>;

  abstract boardUpdate(data: BoardUpdateData): Observable<BoardUpdateResult>;

  abstract boardTaskCreate(data: BoardTaskCreateData): Observable<BoardTaskCreateResult>;

  abstract boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult>;

  abstract boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult>;

  abstract updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardId: string, boardTaskId: string, boardTaskSubtaskId: string): Observable<void>;
}
