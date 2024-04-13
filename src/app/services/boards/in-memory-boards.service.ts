import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError, combineLatest, map, Observable, of, switchMap, take, tap} from 'rxjs';
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
  BoardTaskUpdateResult,
} from '../../models/board-task';
import {BoardTaskSubtask} from '../../models/board-task-subtask';
import {InMemoryError} from '../../models/in-memory-error';
import {getDocId} from '../../utils/create-doc-id';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {User} from '../auth/models/user';
import {UserBoard} from '../auth/models/user-board';
import {BoardsServiceAbstract} from './boards-service.abstract';
import {defaultInMemoryBoards, defaultInMemoryUsers, InMemoryStore} from './data';

@Injectable({
  providedIn: 'root'
})
export class InMemoryBoardsService extends BoardsServiceAbstract {

  private _emptyInMemoryStore: InMemoryStore = {
    boards: {},
    users: {}
  }
  private _userId = '0';
  private _inMemoryStore$ = new BehaviorSubject<InMemoryStore>(this._emptyInMemoryStore);

  override user$ = this._inMemoryStore$.pipe(
    getProtectedRxjsPipe(),
    map((inMemoryStore) => {

      if (!inMemoryStore) {
        return null;
      }

      const inMemoryUser = inMemoryStore.users[this._userId];

      if (!inMemoryUser) {
        return null;
      }

      const user: User = {
        id: inMemoryUser.id,
        disabled: inMemoryUser.disabled,
        boardsIds: inMemoryUser.boardsIds,
        darkMode: inMemoryUser.darkMode
      };

      return user;
    }),
    tap(() => this.resetSelectingUser()),
    getProtectedRxjsPipe()
  );

  override userBoards$ = combineLatest([
    this._inMemoryStore$.pipe(getProtectedRxjsPipe()),
    this.user$
  ]).pipe(
    map(([inMemoryStore, user]) => {

      if (!inMemoryStore || !user) {
        return null;
      }

      return inMemoryStore.users[this._userId].boardsIds.map((boardId) => {
        return inMemoryStore.users[this._userId].userBoards[boardId];
      });
    }),
    tap(() => this.resetSelectingUserBoards()),
    getProtectedRxjsPipe()
  );

  private _board$ = this.boardId$.pipe(
    getProtectedRxjsPipe(),
    switchMap((boardId) => {

      if (!boardId) {
        return of(null);
      }

      return this._inMemoryStore$.pipe(
        getProtectedRxjsPipe(),
        map((inMemoryStore) => {
          return inMemoryStore.boards[boardId];
        })
      );
    }),
    getProtectedRxjsPipe()
  );

  override board$ = this._board$.pipe(
    getProtectedRxjsPipe(),
    map((inMemoryBoard) => {

      if (!inMemoryBoard) {
        return null;
      }

      const board: Board = {
        id: inMemoryBoard.id,
        name: inMemoryBoard.name,
        boardStatusesIds: inMemoryBoard.boardStatusesIds,
        boardTasksIds: inMemoryBoard.boardTasksIds
      };

      return board;
    }),
    tap(() => this.resetSelectingBoard()),
    getProtectedRxjsPipe()
  );

  override boardStatuses$ = this._board$.pipe(
    getProtectedRxjsPipe(),
    map((inMemoryBoard) => {
      return inMemoryBoard?.boardStatuses || null;
    }),
    tap(() => this.resetSelectingBoardStatuses()),
    getProtectedRxjsPipe()
  );

  override boardTasks$ = this._board$.pipe(
    getProtectedRxjsPipe(),
    map((inMemoryBoard) => {

      const inMemoryBoardTasks = inMemoryBoard?.boardTasks;

      if (!inMemoryBoardTasks) {
        return null;
      }

      const boardTasks: { [key in string]: BoardTask } = {};

      for (const inMemoryBoardTaskId of Object.getOwnPropertyNames(inMemoryBoardTasks)) {

        const inMemoryBoardTask = inMemoryBoardTasks[inMemoryBoardTaskId];

        const boardTask: BoardTask = {
          id: inMemoryBoardTask.id,
          title: inMemoryBoardTask.title,
          description: inMemoryBoardTask.description,
          boardTaskSubtasksIds: inMemoryBoardTask.boardTaskSubtasksIds,
          boardStatusId: inMemoryBoardTask.boardStatusId,
          completedBoardTaskSubtasks: inMemoryBoardTask.completedBoardTaskSubtasks
        };

        Object.assign(boardTasks, {[boardTask.id]: {boardTask}});
      }

      return boardTasks;
    }),
    tap(() => this.resetSelectingBoardTasks()),
    getProtectedRxjsPipe()
  );

  constructor() {
    super();
  }

  private _InMemoryStoreRequest = this._inMemoryStore$.pipe(getProtectedRxjsPipe());

  private _Request<RequestResult>(request: (inMemoryStore: InMemoryStore) => {
    data: RequestResult;
    inMemoryStore: InMemoryStore;
  }) {
    return this._InMemoryStoreRequest.pipe(
      take(1),
      map(request),
      catchError((error) => {
        InMemoryError.testRequirement(!(error instanceof InMemoryError));
        throw error;
      }),
      tap((result) => this._inMemoryStore$.next(result.inMemoryStore)),
      map((result) => result.data),
    );
  }

  boardCreate(data: BoardCreateData) {

    return this._Request<BoardCreateResult>((inMemoryStore) => {

      const user = inMemoryStore.users[this._userId];

      InMemoryError.testRequirement(!user, {code: 'unauthenticated'});
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(user.boardsIds.length >= 5, {
        code: 'resource-exhausted',
        message: 'User can have 5 boards'
      });

      const boardId = getDocId(Object.getOwnPropertyNames(inMemoryStore.boards).toSet());

      const boardStatusesIdsSet = new Set<string>();
      const boardStatuses = {};

      for (const boardStatusName of data.boardStatusesNames) {
        const boardStatusId = getDocId(boardStatusesIdsSet);
        const boardStatus: BoardStatus = {
          id: boardStatusId,
          name: boardStatusName,
          boardTasksIds: [] as string[]
        };
        Object.assign(boardStatuses, {[boardStatusId]: boardStatus});
        boardStatusesIdsSet.add(boardStatusId);
      }

      const boardStatusesIds = boardStatusesIdsSet.toArray();

      const board: Board = {
        id: boardId,
        name: data.name,
        boardStatusesIds,
        boardTasksIds: [] as string[]
      };
      Object.assign(inMemoryStore.boards, {[boardId]: board});

      user.boardsIds.push(boardId);

      const userBoard: UserBoard = {
        id: boardId,
        name: data.name
      };
      Object.assign(user.userBoards, {[boardId]: userBoard});

      const createBoardResult: BoardCreateResult = {
        id: boardId,
        boardsIds: [...user.boardsIds],
        boardStatusesIds
      };

      return {
        data: createBoardResult,
        inMemoryStore
      };
    });
  }

  boardDelete(data: BoardDeleteData) {

    return this._Request<BoardDeleteResult>((inMemoryStore) => {

      const user = inMemoryStore.users[this._userId];

      InMemoryError.testRequirement(!user, {code: 'unauthenticated'});
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId) => boardId === data.id), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      delete inMemoryStore.boards[data.id];

      user.boardsIds = user.boardsIds.toSet().difference([data.id].toSet()).toArray();
      delete user.userBoards[data.id];

      this._inMemoryStore$.next(inMemoryStore);

      return {
        data: {
          boardsIds: [...user.boardsIds]
        },
        inMemoryStore
      };
    });
  }

  boardUpdate(data: BoardUpdateData) {

    return this._Request<BoardUpdateResult>((inMemoryStore) => {

      const user = inMemoryStore.users[this._userId];

      InMemoryError.testRequirement(!user, {code: 'unauthenticated'});
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId) => boardId === data.id), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const board = inMemoryStore.boards[data.id];

      board.name = data.name;

      const currentBoardStatusesIds = board.boardStatusesIds || [];
      const newBordStatusesIdsFromData = data.boardStatuses.filter((s) => s.id).map((s) => s.id) as string[];

      const boardStatusesIdsToRemove = currentBoardStatusesIds.toSet().difference(newBordStatusesIdsFromData.toSet()).toArray();

      const boardStatusesTasksIdsToRemove = [];
      const tasksIdsToRemove = [];

      for (const boardStatusesIdToRemove of boardStatusesIdsToRemove) {
        const boardStatusToRemove = board.boardStatuses[boardStatusesIdToRemove];
        boardStatusesTasksIdsToRemove.push(...boardStatusToRemove.boardTasksIds);
        delete board.boardStatuses[boardStatusesIdToRemove];
      }

      for (const boardStatusesTaskIdToRemove of boardStatusesTasksIdsToRemove) {
        delete board.boardTasks[boardStatusesTaskIdToRemove];
        tasksIdsToRemove.push(boardStatusesTaskIdToRemove);
      }

      const boardStatusesIdsSet = new Set<string>(currentBoardStatusesIds.toSet().difference(boardStatusesIdsToRemove.toSet()));

      const boardStatuses = board.boardStatuses;

      for (let i = 0; i < data.boardStatuses.length; ++i) {

        let boardStatusId = data.boardStatuses[i].id;
        let boardStatus = board.boardStatuses[boardStatusId || ''];

        if (!boardStatus) {
          boardStatusId = getDocId(boardStatusesIdsSet);
          boardStatusesIdsSet.add(boardStatusId);
          boardStatus = {
            id: boardStatusId,
            name: data.boardStatuses[i].name,
            boardTasksIds: []
          };
          Object.assign(boardStatuses, {[boardStatusId]: boardStatus});
        } else {
          boardStatus.name = data.boardStatuses[i].name;
        }
      }

      const boardStatusesIds = boardStatusesIdsSet.toArray();

      InMemoryError.testRequirement(boardStatusesIds.length > 5, {
        code: 'resource-exhausted',
        message: 'Board can have 5 statuses'
      })

      const boardTasksIds = board.boardTasksIds.toSet().difference(tasksIdsToRemove.toSet()).toArray();
      board.boardTasksIds = boardTasksIds;

      user.userBoards[data.id].name = data.name;

      return {
        data: {
          boardStatusesIds,
          boardTasksIds
        },
        inMemoryStore
      };
    });
  }

  boardTaskCreate(data: BoardTaskCreateData) {

    return this._Request<BoardTaskCreateResult>((inMemoryStore) => {

      const user = inMemoryStore.users[this._userId];
      InMemoryError.testRequirement(!user, {code: 'unauthenticated'});
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId) => boardId === data.boardId), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const board = inMemoryStore.boards[data.boardId];

      InMemoryError.testRequirement(board.boardTasksIds.length >= 20, {
        code: 'resource-exhausted',
        message: 'Selected board can have 20 tasks'
      });

      InMemoryError.testRequirement(!board.boardStatusesIds.toSet().has(data.boardStatusId), {
        code: 'not-found',
        message: 'Selected status do not exist'
      });

      InMemoryError.testRequirement(data.boardTaskSubtasksTitles.length > 5, {
        code: 'resource-exhausted',
        message: 'BoardTask can have 5 subtasks'
      });

      const boardStatus = board.boardStatuses[data.boardStatusId];

      const boardTaskId = getDocId(Object.getOwnPropertyNames(board.boardTasks).toSet());

      const boardTasksIds = [boardTaskId, ...board.boardTasksIds];
      const boardStatusBoardTasksIds = [boardTaskId, ...boardStatus.boardTasksIds];

      board.boardTasksIds = boardTasksIds;
      boardStatus.boardTasksIds = boardStatusBoardTasksIds;

      const boardTaskSubtasksIdsSet = new Set<string>();
      const boardTaskSubtasks = {};

      for (const boardTaskSubtaskTitle of data.boardTaskSubtasksTitles) {
        const boardTaskSubtaskId = getDocId(boardTaskSubtasksIdsSet);
        const boardTaskSubtask: BoardTaskSubtask = {
          id: boardTaskSubtaskId,
          title: boardTaskSubtaskTitle,
          isCompleted: false
        };
        Object.assign(boardTaskSubtasks, {[boardTaskSubtaskId]: boardTaskSubtask});
        boardTaskSubtasksIdsSet.add(boardTaskSubtaskId);
      }

      const boardTaskSubtasksIds = boardTaskSubtasksIdsSet.toArray();

      const boardTask: BoardTask = {
        id: boardTaskId,
        title: data.title,
        description: data.description,
        boardTaskSubtasksIds,
        boardStatusId: data.boardStatusId,
        completedBoardTaskSubtasks: 0
      };

      Object.assign(board.boardTasks, {[boardTaskId]: boardTask});

      return {
        data: {
          id: boardTaskId,
          boardTasksIds,
          boardStatusBoardTasksIds,
          boardTaskSubtasksIds
        },
        inMemoryStore
      }
    });
  }

  boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult> {

    return this._Request<BoardTaskDeleteResult>((inMemoryStore) => {

      const user = inMemoryStore.users[this._userId];

      InMemoryError.testRequirement(!user, {code: 'unauthenticated'});
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId) => boardId === data.id), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const board = inMemoryStore.boards[data.boardId];

      const boardTask = board.boardTasks[data.id];
      InMemoryError.testRequirement(!boardTask, {code: 'not-found', message: 'Board task not found'});

      const boardStatus = board.boardStatuses[boardTask.boardStatusId];

      boardStatus.boardTasksIds = boardStatus.boardTasksIds.toSet().difference([board.id].toSet()).toArray();

      delete board.boardTasks[boardTask.id];

      board.boardTasksIds = board.boardTasksIds.toSet().difference([boardTask.id].toSet()).toArray();

      return {
        data: undefined,
        inMemoryStore
      };
    });
  }

  boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult> {

    return this._Request((inMemoryStore) => {

      const user = inMemoryStore.users[this._userId];

      InMemoryError.testRequirement(!user, {code: 'unauthenticated'});
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId) => boardId === data.boardId), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const board = inMemoryStore.boards[data.boardId];

      const boardStatus = board.boardStatuses[data.boardStatus.id];
      InMemoryError.testRequirement(!boardStatus, {code: 'not-found', message: 'Board status not found'});

      const boardTask = board.boardTasks[data.id];
      InMemoryError.testRequirement(!boardTask, {code: 'not-found', message: 'Board task not found'});

      let newBoardStatus;

      if (data.boardStatus.newId) {
        boardStatus.boardTasksIds = boardStatus.boardTasksIds.filter((boardTaskId) => boardTaskId !== data.id)
        newBoardStatus = board.boardStatuses[data.boardStatus.newId];
        InMemoryError.testRequirement(!newBoardStatus, {code: 'not-found', message: 'New status not found'});
        newBoardStatus.boardTasksIds = [data.id, ...newBoardStatus.boardTasksIds];
      }

      const currentBoardTaskSubtasksIds = boardTask.boardTaskSubtasksIds || [];
      const newBoardTaskSubtasksIds = data.boardTaskSubtasks.filter((s) => s.id).map((s) => s.id) as string[];

      const boardTaskSubtasksIdsToRemove = currentBoardTaskSubtasksIds.toSet().difference(newBoardTaskSubtasksIds.toSet()).toArray();

      for (const boardTaskSubtaskIdToRemove of boardTaskSubtasksIdsToRemove) {
        delete boardTask.boardTaskSubtasks[boardTaskSubtaskIdToRemove];
      }

      const boardTaskSubtasksIdsSet = new Set<string>(currentBoardTaskSubtasksIds.toSet().difference(boardTaskSubtasksIdsToRemove.toSet()));

      for (let i = 0; i < data.boardTaskSubtasks.length; ++i) {

        let boardTaskSubtaskId = data.boardTaskSubtasks[i].id;
        let boardTaskSubtask = boardTask.boardTaskSubtasks[boardTaskSubtaskId || ''];

        if (!boardTaskSubtask) {
          boardTaskSubtaskId = getDocId(boardTaskSubtasksIdsSet);
          boardTaskSubtasksIdsSet.add(boardTaskSubtaskId);
          boardTaskSubtask = {
            id: boardTaskSubtaskId,
            title: data.boardTaskSubtasks[i].title,
            isCompleted: false
          };
          Object.assign(boardTaskSubtask, {[boardTaskSubtaskId]: boardTaskSubtask});
        } else {
          boardTaskSubtask.title = data.boardTaskSubtasks[i].title;
        }
      }

      const boardTaskSubtasksIds = boardTaskSubtasksIdsSet.toArray();
      InMemoryError.testRequirement(boardTaskSubtasksIds.length > 5, {
        code: 'resource-exhausted',
        message: 'Board task can have 5 subtasks'
      });

      boardTask.title = data.title;
      boardTask.description = data.description;
      boardTask.boardTaskSubtasksIds = boardTaskSubtasksIds;
      boardTask.boardStatusId = newBoardStatus ? newBoardStatus.id : boardTask.boardStatusId

      return {
        data: {
          boardTaskSubtasksIds
        },
        inMemoryStore
      }
    });
  }

  updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardId: string, boardTaskId: string, boardTaskSubtaskId: string) {

    return this._Request((inMemoryStore) => {

      const user = inMemoryStore.users[this._userId];

      InMemoryError.testRequirement(!user, {code: 'unauthenticated'});
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((_boardId) => _boardId === boardId), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const board = inMemoryStore.boards[boardId];

      const boardTask = board.boardTasks[boardTaskId];
      InMemoryError.testRequirement(!boardTask, {code: 'not-found', message: 'Board task not found'});

      const boardTaskSubtask = boardTask.boardTaskSubtasks[boardTaskSubtaskId];
      InMemoryError.testRequirement(!boardTaskSubtask, {code: 'not-found', message: 'Board task subtask not found'});

      const isCompletedBefore = boardTaskSubtask.isCompleted;
      const isCompletedAfter = isCompleted;

      boardTaskSubtask.isCompleted = isCompleted;

      if (isCompletedBefore !== isCompletedAfter) {
        boardTask.completedBoardTaskSubtasks = boardTask.completedBoardTaskSubtasks + (isCompletedAfter ? 1 : -1)
      }

      return {
        data: undefined,
        inMemoryStore
      }
    });
  }

  loadDefault() {
    this._inMemoryStore$.next({
      users: defaultInMemoryUsers,
      boards: defaultInMemoryBoards,
    });
  }
}
