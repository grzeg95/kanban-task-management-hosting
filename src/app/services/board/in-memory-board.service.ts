import {Inject, Injectable} from '@angular/core';
import {BehaviorSubject, catchError, combineLatest, map, Observable, of, switchMap, take, tap} from 'rxjs';
import {KanbanConfig} from '../../kanban-config.token';
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
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {User} from '../auth/models/user';
import {UserBoard} from '../auth/models/user-board';
import {SnackBarService} from '../snack-bar.service';
import {BoardServiceAbstract} from './board-service.abstract';
import {defaultInMemoryBoards, defaultInMemoryUsers, InMemoryBoard, InMemoryBoardTask, InMemoryStore} from './data';

@Injectable({
  providedIn: 'root'
})
export class InMemoryBoardService extends BoardServiceAbstract {

  private _emptyInMemoryStore: InMemoryStore = {};
  private _userId = '0';
  private _inMemoryStore$ = new BehaviorSubject<InMemoryStore>(this._emptyInMemoryStore);

  private _inMemoryUser$ = this._inMemoryStore$.pipe(
    getProtectedRxjsPipe(),
    map((inMemoryStore) => {
      return inMemoryStore.users?.[this._userId] || null;
    }),
    getProtectedRxjsPipe()
  );

  override user$ = this._inMemoryUser$.pipe(
    map((inMemoryUser) => {

      if (inMemoryUser === null) {
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
    getProtectedRxjsPipe()
  );

  override userBoards$ = this._inMemoryUser$.pipe(
    map((inMemoryUser) => {

      if (inMemoryUser === null) {
        return null;
      }

      return inMemoryUser.boardsIds.map((boardId) => {
        return inMemoryUser.userBoards[boardId];
      });
    }),
    getProtectedRxjsPipe()
  );

  private _inMemoryBoard$ = this.boardId$.pipe(
    getProtectedRxjsPipe(),
    switchMap((boardId) => {

      if (boardId === null) {
        return of(null);
      }

      if (boardId === undefined) {
        return of(undefined);
      }

      return this._inMemoryStore$.pipe(
        getProtectedRxjsPipe(),
        map((inMemoryStore) => {
          return inMemoryStore.boards?.[boardId] || null;
        })
      );
    }),
    getProtectedRxjsPipe()
  );

  override board$ = this._inMemoryBoard$.pipe(
    map((inMemoryBoard) => {

      if (inMemoryBoard === null) {
        return null;
      }

      if (inMemoryBoard == undefined) {
        return undefined;
      }

      const board: Board = {
        id: inMemoryBoard.id,
        name: inMemoryBoard.name,
        boardStatusesIds: inMemoryBoard.boardStatusesIds,
        boardTasksIds: inMemoryBoard.boardTasksIds
      };

      return board;
    }),
    getProtectedRxjsPipe()
  );

  override boardStatuses$ = this._inMemoryBoard$.pipe(
    map((inMemoryBoard) => {

      if (inMemoryBoard === null) {
        return null;
      }

      return inMemoryBoard?.boardStatuses || {};
    }),
    getProtectedRxjsPipe()
  );

  override boardTasks$ = this._inMemoryBoard$.pipe(
    map((inMemoryBoard) => {

      const inMemoryBoardTasks = inMemoryBoard?.boardTasks;

      if (inMemoryBoardTasks === null) {
        return null;
      }

      if (inMemoryBoardTasks === undefined) {
        return undefined;
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

        Object.assign(boardTasks, {[boardTask.id]: boardTask});
      }

      return boardTasks;
    }),
    getProtectedRxjsPipe()
  );

  private _inMemoryBoardTask$ = combineLatest([
    this._inMemoryBoard$,
    this.boardTaskId$.pipe(getProtectedRxjsPipe())
  ]).pipe(
    map(([inMemoryBoard, boardTaskId]) => {

      if (inMemoryBoard === undefined || boardTaskId === undefined) {
        return undefined;
      }

      if (inMemoryBoard === null || boardTaskId === null) {
        return null;
      }

      const inMemoryBoardTasks = inMemoryBoard.boardTasks;

      if (!inMemoryBoardTasks) {
        return null;
      }

      return inMemoryBoardTasks[boardTaskId] || null;
    }),
    getProtectedRxjsPipe()
  );

  override boardTask$ = this._inMemoryBoardTask$.pipe(
    map((inMemoryBoardTask) => {

      if (inMemoryBoardTask === null) {
        return null;
      }

      if (inMemoryBoardTask === undefined) {
        return undefined;
      }

      const boardTask: BoardTask = {
        id: inMemoryBoardTask.id,
        title: inMemoryBoardTask.title,
        description: inMemoryBoardTask.description,
        boardTaskSubtasksIds: inMemoryBoardTask.boardTaskSubtasksIds,
        boardStatusId: inMemoryBoardTask.boardStatusId,
        completedBoardTaskSubtasks: inMemoryBoardTask.completedBoardTaskSubtasks
      };

      return boardTask;
    }),
    getProtectedRxjsPipe()
  );

  override boardTaskSubtasks$ = this._inMemoryBoardTask$.pipe(
    map((inMemoryBoardTask) => {

      if (inMemoryBoardTask === null) {
        return null;
      }

      if (inMemoryBoardTask === undefined) {
        return undefined;
      }

      return inMemoryBoardTask.boardTaskSubtasks || null;
    }),
    getProtectedRxjsPipe()
  );

  constructor(
    private readonly _snackBarService: SnackBarService,
    @Inject(KanbanConfig) private readonly _kanbanConfig: KanbanConfig
  ) {
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
      catchError((error: Error) => {

        if (!(error instanceof InMemoryError)) {
          error = new InMemoryError();
        }

        this._snackBarService.open(error.message, 3000);

        throw error;
      }),
      tap((result) => this._inMemoryStore$.next(result.inMemoryStore)),
      map((result) => result.data),
    );
  }

  boardCreate(data: BoardCreateData) {

    return this._Request<BoardCreateResult>((inMemoryStore) => {

      if (!inMemoryStore.users) {
        inMemoryStore.users = {};
      }

      const user = inMemoryStore.users[this._userId] || null;
      InMemoryError.testRequirement(!user, {code: 'unauthenticated'});
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(user.boardsIds.length >= this._kanbanConfig.maxUserBoards, {
        code: 'resource-exhausted',
        message: `User can have ${this._kanbanConfig.maxUserBoards} board`
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

      if (!inMemoryStore.users) {
        inMemoryStore.users = {};
      }

      const board: InMemoryBoard = {
        id: boardId,
        name: data.name,
        boardStatusesIds,
        boardTasksIds: [] as string[],
        boardStatuses,
        boardTasks: {}
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
    }).pipe(
      tap(() => {
        this._snackBarService.open('Board has been created', 3000);
      })
    );
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

      return {
        data: {
          boardsIds: [...user.boardsIds]
        },
        inMemoryStore
      };
    }).pipe(
      tap(() => {
        this._snackBarService.open('Board has been deleted', 3000);
      })
    );
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

      InMemoryError.testRequirement(boardStatusesIds.length > this._kanbanConfig.maxBoardStatuses, {
        code: 'resource-exhausted',
        message: `Board can have ${this._kanbanConfig.maxBoardStatuses} statuses`
      })

      const boardTasksIds = board.boardTasksIds.toSet().difference(tasksIdsToRemove.toSet()).toArray();

      board.boardTasksIds = boardTasksIds;
      board.boardStatusesIds = boardStatusesIds;

      user.userBoards[data.id].name = data.name;

      return {
        data: {
          boardStatusesIds,
          boardTasksIds
        },
        inMemoryStore
      };
    }).pipe(
      tap(() => {
        this._snackBarService.open('Board has been updated', 3000);
      })
    );
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

      InMemoryError.testRequirement(board.boardTasksIds.length >= this._kanbanConfig.maxBoardTasks, {
        code: 'resource-exhausted',
        message: `Board can have ${this._kanbanConfig.maxBoardTasks} tasks`
      });

      InMemoryError.testRequirement(!board.boardStatusesIds.toSet().has(data.boardStatusId), {
        code: 'not-found',
        message: 'Board status do not exist'
      });

      InMemoryError.testRequirement(data.boardTaskSubtasksTitles.length > this._kanbanConfig.maxBoardTaskSubtasks, {
        code: 'resource-exhausted',
        message: `Board task can have ${this._kanbanConfig.maxBoardTaskSubtasks} subtasks`
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

      const inMemoryBoardTask: InMemoryBoardTask = {
        id: boardTaskId,
        title: data.title,
        description: data.description,
        boardTaskSubtasksIds,
        boardStatusId: data.boardStatusId,
        completedBoardTaskSubtasks: 0,
        boardTaskSubtasks
      };

      Object.assign(board.boardTasks, {[boardTaskId]: inMemoryBoardTask});

      return {
        data: {
          id: boardTaskId,
          boardTasksIds,
          boardStatusBoardTasksIds,
          boardTaskSubtasksIds
        },
        inMemoryStore
      }
    }).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been created', 3000);
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult> {

    return this._Request<BoardTaskDeleteResult>((inMemoryStore) => {

      const user = inMemoryStore.users[this._userId];

      InMemoryError.testRequirement(!user, {code: 'unauthenticated'});
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId) => boardId === data.boardId), {
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
    }).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been deleted', 3000);
      })
    );
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

      InMemoryError.testRequirement(boardTaskSubtasksIds.length > this._kanbanConfig.maxBoardTaskSubtasks, {
        code: 'resource-exhausted',
        message: `Board task can have ${this._kanbanConfig.maxBoardTaskSubtasks} subtasks`
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
    }).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been updated', 3000);
      })
    );
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
