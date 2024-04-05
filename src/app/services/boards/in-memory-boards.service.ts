import {Injectable} from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';
import {BehaviorSubject, map, Observable, of, switchMap, throwError} from 'rxjs';
import {
  Board,
  CreateBoardData,
  CreateBoardResult,
  DeleteBoardData,
  DeleteBoardResult,
  UpdateBoardData,
  UpdateBoardResult
} from '../../models/board';
import {Status} from '../../models/status';
import {Subtask} from '../../models/subtask';
import {
  CreateTaskData,
  CreateTaskResult,
  DeleteTaskData,
  DeleteTaskResult,
  Task,
  UpdateTaskData,
  UpdateTaskResult
} from '../../models/task';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {User} from '../auth/user.model';
import {BoardsServiceTypes} from './boards-service.types';
import {defaultBoards, defaultUser} from './data';

@Injectable({
  providedIn: 'root'
})
export class InMemoryBoardsService extends BoardsServiceTypes {

  private _store$ = new BehaviorSubject<{ [key in string]: Board }>(cloneDeep(defaultBoards));
  private _user$ = new BehaviorSubject<User>(cloneDeep(defaultUser));
  override user$ = this._user$.pipe(getProtectedRxjsPipe());

  override board$ = this.boardId$.pipe(
    getProtectedRxjsPipe(),
    switchMap((boardId) => {

      if (!boardId) {
        this.resetSelectingOfBoard();
        return of(null);
      }

      return this._store$.pipe(
        getProtectedRxjsPipe(),
        map((store) => {
          this.resetSelectingOfBoard();
          return store[boardId] || null;
        })
      );
    })
  );

  constructor() {
    super();
  }

  createBoard(data: CreateBoardData): Observable<CreateBoardResult> {

    const boards = cloneDeep(this._store$.value);
    let maxId = -Infinity;

    for (const [id] of Object.entries(boards)) {
      if (+id > maxId) {
        maxId = +id;
      }
    }

    if (maxId === -Infinity) {
      maxId = 0;
    }

    const boardId = (maxId + 1) + '';

    const statuses = data.statusesNames.map((statusName, index) => {

      const status: Status = {
        id: (+index + 1) + '',
        name: statusName,
        tasksIdsSequence: [] as string[],
        tasks: {} as { [key in string]: Task }
      };

      return status;
    });

    const statusesIdsSequence = statuses.map((status) => status.id);

    const board: Board = {
      id: boardId,
      name: data.name,
      statusesIdsSequence,
      statuses: statuses.reduce((acc, status) => {
        acc[status.id] = status;
        return acc;
      }, {} as { [key in string]: Status })
    };

    const user = cloneDeep({
      ...defaultUser,
      ...this.user$
    });
    user.boards = [...user.boards || [], {name: data.name, id: boardId}];
    this._user$.next(user);

    boards[boardId] = board;
    this._store$.next(boards);

    const createBoardResult: CreateBoardResult = {
      id: boardId,
      boards: user.boards,
      statusesIdsSequence
    };

    return of(cloneDeep(createBoardResult));
  }

  deleteBoard(data: DeleteBoardData): Observable<DeleteBoardResult> {

    const boards = cloneDeep(this._store$.value);

    const board = boards[data.id];

    if (!board) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }))
    }

    delete boards[data.id];

    this._store$.next(boards);

    const user = cloneDeep({
      ...defaultUser,
      ...this.user$
    });
    user.boards = (user.boards || []).filter((board) => board.id !== data.id);
    this._user$.next(user);

    return of(undefined);
  }

  updateBoard(data: UpdateBoardData): Observable<UpdateBoardResult> {

    const boards = cloneDeep(this._store$.value);

    const board = boards[data.id];

    if (!board) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    board.name = data.name;

    const user = cloneDeep({
      ...defaultUser,
      ...this.user$
    });
    user.boards.find((board) => board.id === data.id)!.name = data.name;

    this._user$.next(user);

    const statusesIdsSequence = board.statusesIdsSequence;
    const newStatusesIds = data.statuses.filter((s) => s.id).map((s) => s.id) as string[];

    const statusesIdsToRemove = statusesIdsSequence.toSet().difference(newStatusesIds.toSet());

    for (const statusIdRemove of statusesIdsToRemove) {
      if (Object.prototype.hasOwnProperty.call(board.statuses, statusIdRemove)) {
        delete board.statuses[statusIdRemove];
      }
    }

    let maxStatusId = -Infinity;

    for (const [id] of Object.entries(board.statuses)) {
      if (+id > maxStatusId) {
        maxStatusId = +id;
      }
    }

    if (maxStatusId === -Infinity) {
      maxStatusId = 0;
    }

    const newStatusesIdsSequence: string[] = [];

    for (let i = 0; i < data.statuses.length; ++i) {

      const statusId = data.statuses[i].id;

      if (!statusId || statusId && !Object.prototype.hasOwnProperty.call(board.statuses, statusId)) {

        const id = ++maxStatusId + '';

        const status: Status = {
          id,
          name: data.statuses[i].name,
          tasksIdsSequence: [] as string[],
          tasks: {} as { [key in string]: Task }
        };

        board.statuses[status.id] = status;
        newStatusesIdsSequence.push(status.id);
      }

      if (statusId && Object.prototype.hasOwnProperty.call(board.statuses, statusId)) {
        board.statuses[statusId].name = data.statuses[i].name;
        newStatusesIdsSequence.push(statusId);
      }
    }

    board.statusesIdsSequence = newStatusesIdsSequence;

    this._store$.next(boards);

    const updateBoardResult: UpdateBoardResult = {
      id: board.id,
      statusesIdsSequence: newStatusesIdsSequence
    };

    return of(updateBoardResult);
  }

  createTask(data: CreateTaskData): Observable<CreateTaskResult> {

    const boards = cloneDeep(this._store$.value);

    const board = boards[data.boardId];

    if (!board) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    const status = board.statuses[data.boardStatusId];

    if (!status) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    let maxTaskId = -Infinity;

    for (const id of status.tasksIdsSequence) {
      if (+id > maxTaskId) {
        maxTaskId = +id;
      }
    }

    if (maxTaskId === -Infinity) {
      maxTaskId = 0;
    }

    const taskId = ++maxTaskId + '';

    const tasksIdsSequence = [taskId, ...board.statuses[data.boardStatusId].tasksIdsSequence];
    board.statuses[data.boardStatusId].tasksIdsSequence = tasksIdsSequence;

    const subtasksIdsSequence: string[] = [];
    const subtasks: { [key in string]: Subtask } = {};

    data.subtasks.forEach((subtask, index) => {

      const id = index + '';

      subtasksIdsSequence.push(id);

      subtasks[id] = {
        id,
        title: subtask,
        isCompleted: false
      };
    });

    const task: Task = {
      id: taskId,
      title: data.title,
      description: data.description,
      subtasks,
      subtasksIdsSequence
    };

    board.statuses[data.boardStatusId].tasks[taskId] = task;

    this._store$.next(boards);

    const createTaskResult: CreateTaskResult = {
      id: taskId,
      tasksIdsSequence,
      subtasksIdsSequence
    }

    return of(createTaskResult);
  }

  deleteTask(data: DeleteTaskData): Observable<DeleteTaskResult> {

    const boards = cloneDeep(this._store$.value);

    const board = boards[data.boardId];

    if (!board) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    const status = board.statuses[data.boardStatusId];

    if (!status) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    const task = status.tasks[data.id];

    if (!task) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    delete status.tasks[data.id];
    status.tasksIdsSequence = status.tasksIdsSequence.filter((id) => id !== data.id);

    this._store$.next(boards);

    return of(undefined);
  }

  updateTask(data: UpdateTaskData): Observable<UpdateTaskResult> {

    const boards = cloneDeep(this._store$.value);

    const board = boards[data.boardId];

    if (!board) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    const status = board.statuses[data.status.id];

    if (!status) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    const task = status.tasks[data.id];

    if (!task) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    task.title = data.title;
    task.description = data.description;

    const subtasksIdsSequence = task.subtasksIdsSequence || [];
    const newSubtasksIds = data.subtasks.filter((s) => s.id).map((s) => s.id) as string[];

    const subtasksIdsToRemove = subtasksIdsSequence.toSet().difference(newSubtasksIds.toSet());

    for (const subtaskIdToRemove of subtasksIdsToRemove) {
      if (Object.prototype.hasOwnProperty.call(task.subtasks, subtaskIdToRemove)) {
        delete task.subtasks[subtaskIdToRemove];
      }
    }

    let maxSubtaskId = -Infinity;

    for (const id of task.subtasksIdsSequence) {
      if (+id > maxSubtaskId) {
        maxSubtaskId = +id;
      }
    }

    if (maxSubtaskId === -Infinity) {
      maxSubtaskId = 0;
    }

    const newSubtasksIdsSequence: string[] = [];

    for (let i = 0; i < data.subtasks.length; ++i) {

      const subtaskId = data.subtasks[i].id;

      if (!subtaskId || subtaskId && !Object.prototype.hasOwnProperty.call(task.subtasks, subtaskId)) {

        const id = ++maxSubtaskId + '';

        const subtask: Subtask = {
          id,
          title: data.subtasks[i].title,
          isCompleted: false
        };

        task.subtasks[subtask.id] = subtask;
        newSubtasksIdsSequence.push(subtask.id);
      }

      if (subtaskId && Object.prototype.hasOwnProperty.call(task.subtasks, subtaskId)) {
        newSubtasksIdsSequence.push(subtaskId);
      }
    }

    task.subtasksIdsSequence = newSubtasksIdsSequence;

    if (data.status.newId) {

      if (!board.statuses[data.status.newId]) {
        return throwError(() => ({
          code: 'not-found',
          message: 'Not found'
        }));
      }

      if (data.status.id === data.status.newId) {
        return throwError(() => ({
          code: 'invalid-argument',
          message: 'Invalid argument'
        }));
      }

      delete board.statuses[data.status.id].tasks[task.id];
      board.statuses[data.status.id].tasksIdsSequence = board.statuses[data.status.id].tasksIdsSequence.filter((taskId) => task.id !== taskId);

      board.statuses[data.status.newId].tasks[task.id] = task;
      board.statuses[data.status.newId].tasksIdsSequence.unshift(task.id);
    }

    this._store$.next(boards);

    const updateTaskResult: UpdateTaskResult = {
      id: data.id,
      subtasksIdsSequence: newSubtasksIdsSequence
    }

    return of(updateTaskResult);
  }

  toggleSubtaskCompletion(boardId: string, statusId: string, taskId: string, subtaskId: string, isCompleted: boolean) {

    const boards = cloneDeep(this._store$.value);

    if (!boards) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    const board = boards[boardId];

    if (!board) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    const status = board.statuses[statusId];

    if (!status) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    const task = status.tasks[taskId];

    if (!task) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    const subtask = task.subtasks[subtaskId];

    if (!subtask) {
      return throwError(() => ({
        code: 'not-found',
        message: 'Not found'
      }));
    }

    subtask.isCompleted = isCompleted;

    this._store$.next(boards);

    return of(undefined);
  }

  loadDefault() {
    this._user$.next(cloneDeep(defaultUser));
    this._store$.next(cloneDeep(defaultBoards));
  }
}
