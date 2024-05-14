import {Inject, Injectable} from '@angular/core';
import {limit} from '@angular/fire/firestore';
import {BehaviorSubject, catchError, combineLatest, from, map, Observable, of, switchMap, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
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
import {User, UserDoc} from '../auth/models/user';
import {UserBoard} from '../auth/models/user-board';
import {Collections} from '../firebase/collections';
import {collectionSnapshots} from '../firebase/firestore';
import {SnackBarService} from '../snack-bar.service';
import {BoardServiceAbstract} from './board-service.abstract';
import {InMemoryBoard, InMemoryUser} from './data';
import {Data, doc, DocumentSnapshot, InMemory, WriteBatch} from '../../utils/store';

@Injectable({
  providedIn: 'root'
})
export class InMemoryBoardService extends BoardServiceAbstract {

  // conventer

  private _userId = '0';

  private _inMemoryUser$ = new Observable<DocumentSnapshot>((subscriber) => {

    const unsubscribe = doc(this._inMemory, `users/${this._userId}`).snapshots({
      next: subscriber.next.bind(subscriber),
      error: subscriber.error.bind(subscriber),
      complete: subscriber.complete.bind(subscriber)
    });
    return {unsubscribe};
  }).pipe(
    // getProtectedRxjsPipe(),
    map((value) => {
      return User.storeData(value);
    }),
    // getProtectedRxjsPipe()
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
    // getProtectedRxjsPipe()
  );

  override loadingUser$ = this.user$.pipe(map((user) => user === undefined));

  override userBoards$ = this.user$.pipe(
    switchMap((user) => {

      if (user === null) {
        return of(null);
      }

      if (user === undefined) {
        return of(undefined);
      }

      const userBoardCollectionRef = UserBoard.storeCollectionRef(User.storeRef(this._inMemory, user.id));

      return new Observable<DocumentSnapshot[]>((subscriber) => {

        const unsubscribe = userBoardCollectionRef.snapshots({
          next: subscriber.next.bind(subscriber),
          error: subscriber.error.bind(subscriber),
          complete: subscriber.complete.bind(subscriber)
        });
        return {unsubscribe};
      }).pipe(
        map((userBoardsDocumentSnapshots) => {

          const querySnapUserBoardMap = new Map<string, UserBoard>();

          for (const userBoardsDocumentSnapshot of userBoardsDocumentSnapshots) {
            querySnapUserBoardMap.set(userBoardsDocumentSnapshot.id, UserBoard.storeData(userBoardsDocumentSnapshot));
          }

          return user.boardsIds.map((boardId) => {
            return querySnapUserBoardMap.get(boardId);
          }).filter((userBoard) => !!userBoard) as UserBoard[];
        })
      );
    }),
    // getProtectedRxjsPipe(),
    tap((userBoards) => console.log({userBoards}))
  );

  override loadingUserBoards$ = this.userBoards$.pipe(map((userBoards) => userBoards === undefined));

  private _inMemoryBoard$ = this.boardId$.pipe(
    // getProtectedRxjsPipe(),
    switchMap((boardId) => {

      if (boardId === null) {
        return of(null);
      }

      if (boardId === undefined) {
        return of(undefined);
      }

      return new Observable<DocumentSnapshot>((subscriber) => {
        const unsubscribe = doc(this._inMemory, `boards/${boardId}`).snapshots({
          next: (documentSnapshot) => subscriber.next(documentSnapshot),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete()
        });
        return {unsubscribe};
      }).pipe(
        // getProtectedRxjsPipe(),
        map((value) => {
          return (value.exists && value.data as InMemoryBoard) || null;
        })
      );
    }),
    // getProtectedRxjsPipe()
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
    // getProtectedRxjsPipe()
  );

  override loadingBoard$ = this.board$.pipe(map((board) => board === undefined));

  override boardStatuses$ = this._inMemoryBoard$.pipe(
    map((inMemoryBoard) => {

      if (inMemoryBoard === null) {
        return null;
      }

      return inMemoryBoard?.boardStatuses || {};
    }),
    // getProtectedRxjsPipe()
  );

  override loadingBoardStatuses$ = this.boardStatuses$.pipe(map((boardStatuses) => boardStatuses === undefined));

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
    // getProtectedRxjsPipe()
  );

  override loadingBoardTasks$ = this.boardTasks$.pipe(map((boardTasks) => boardTasks === undefined));

  private _inMemoryBoardTask$ = combineLatest([
    this._inMemoryBoard$,
    this.boardTaskId$/*.pipe(getProtectedRxjsPipe())*/
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
    // getProtectedRxjsPipe()
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
    // getProtectedRxjsPipe()
  );

  override loadingBoardTask$ = this.boardTask$.pipe(map((boardTask) => boardTask === undefined));

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
    // getProtectedRxjsPipe()
  );

  override loadingBoardTaskSubtasks$ = this.boardTaskSubtasks$.pipe(map((boardTaskSubtasks) => boardTaskSubtasks === undefined));

  constructor(
    private readonly _inMemory: InMemory,
    private readonly _snackBarService: SnackBarService,
    @Inject(KanbanConfig) private readonly _kanbanConfig: KanbanConfig
  ) {
    super();
  }

  private _Request<RequestResult>(request: () => Promise<RequestResult>) {
    return from(request()).pipe(
      catchError((error: Error) => {

        console.error(error);

        if (!(error instanceof InMemoryError)) {
          error = new InMemoryError();
        }

        this._snackBarService.open(error.message, 3000);

        throw error;
      })
    );
  }

  boardCreate(data: BoardCreateData) {

    return this._Request<BoardCreateResult>(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = User.storeRef(this._inMemory, this._userId);
      const userSnap = await userRef.get();
      const user = User.storeData(userSnap);

      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(user.boardsIds.length >= this._kanbanConfig.maxUserBoards, {
        code: 'resource-exhausted',
        message: `User can have ${this._kanbanConfig.maxUserBoards} boards`
      });

      InMemoryError.testRequirement(data.boardStatusesNames.length > this._kanbanConfig.maxBoardStatuses, {
        code: 'resource-exhausted',
        message: `Board can have ${this._kanbanConfig.maxBoardStatuses} statuses`
      });

      const boardRef = Board.storeRef(this._inMemory);

      const boardStatusesIds: string[] = [];

      for (const boardStatusName of data.boardStatusesNames) {

        const boardStatusRef = boardRef.collection(Collections.boardStatuses).doc();

        const boardStatus = {
          name: boardStatusName,
          boardTasksIds: [] as string[]
        } as BoardStatus & Data;

        writeBatch.create(boardStatusRef, boardStatus);
        boardStatusesIds.push(boardStatusRef.id);
      }

      const board = {
        name: data.name,
        boardStatusesIds,
        boardTasksIds: [] as string[]
      } as Board & Data;

      writeBatch.create(boardRef, board);

      const boardsIds = [...user.boardsIds, boardRef.id];

      if (!userSnap.exists) {
        writeBatch.create(userSnap.reference, {
          boardsIds
        } as User & Data);
      } else {
        writeBatch.update(userSnap.reference, {
          boardsIds
        } as User & Data);
      }

      const userBoardRef = userSnap.reference.collection(Collections.userBoards).doc(boardRef.id);
      writeBatch.create(userBoardRef, {
        name: data.name
      } as UserBoard & Data);

      await writeBatch.commit();

      return {
        id: boardRef.id,
        boardsIds,
        boardStatusesIds
      };
    }).pipe(
      tap(() => {
        this._snackBarService.open('Board has been created', 3000);
      })
    );
  }

  boardDelete(data: BoardDeleteData) {

    return this._Request<BoardDeleteResult>(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = doc(this._inMemory, `${Collections.users}/${this._userId}`);
      const userSnap = await userRef.get();
      const user = userSnap.data as UserDoc;
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId) => boardId === data.id), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const boardRef = Board.storeRef(this._inMemory, data.id);
      const boardSnap = await boardRef.get();
      const board = Board.storeData(boardSnap);
      writeBatch.delete(boardSnap.reference);

      const boardTasksRefs = BoardTask.storeRefs(boardSnap.reference, board);
      const boardTasksSnapsPromise: Promise<DocumentSnapshot>[] = [];

      for (const boardTasksRef of boardTasksRefs) {
        boardTasksSnapsPromise.push(boardTasksRef.get());
      }

      const boardTasksSnaps = await Promise.all(boardTasksSnapsPromise);

      const boardTasksSubtasksRefs = [];
      for (const boardTaskSnap of boardTasksSnaps) {
        writeBatch.delete(boardTaskSnap.reference);
        const boardTask = BoardTask.storeData(boardTaskSnap)!;
        boardTasksSubtasksRefs.push(BoardTaskSubtask.storeRefs(boardTaskSnap.reference, boardTask));
      }
      const boardTasksSubtasksSnapsPromises = [];

      for (const boardTaskSubtasksRefs of boardTasksSubtasksRefs) {
        for (const boardTaskSubtasksRef of boardTaskSubtasksRefs) {
          boardTasksSubtasksSnapsPromises.push(boardTaskSubtasksRef.get());
        }
      }

      const boardTasksSubtasksSnaps = await Promise.all(boardTasksSubtasksSnapsPromises);

      for (const boardTaskSubtasksSnap of boardTasksSubtasksSnaps) {
        writeBatch.delete(boardTaskSubtasksSnap.reference);
      }

      const boardStatusesRefs = BoardStatus.storeCollectionRefs(boardRef, board);
      const boardStatusesSnapsPromises: Promise<DocumentSnapshot>[] = [];

      for (const boardStatusesRef of boardStatusesRefs) {
        boardStatusesSnapsPromises.push(boardStatusesRef.get());
      }
      const boardStatusesSnaps = await Promise.all(boardStatusesSnapsPromises);

      for (const boardStatusesSnap of boardStatusesSnaps) {
        writeBatch.delete(boardStatusesSnap.reference);
      }

      const boardsIds = user.boardsIds.filter((boardId) => boardId !== data.id);

      const userBoardRef = userSnap.reference.collection(Collections.userBoards).doc(boardRef.id);
      writeBatch.delete(userBoardRef);

      writeBatch.update(userSnap.reference, {
        boardsIds
      });

      await writeBatch.commit();

      return {
        boardsIds
      };
    }).pipe(
      tap(() => {
        this._snackBarService.open('Board has been deleted', 3000);
      })
    );
  }

  boardUpdate(data: BoardUpdateData) {

    return this._Request<BoardUpdateResult>(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = User.storeRef(this._inMemory, this._userId);
      const userSnap = await userRef.get();
      const user = User.storeData(userSnap);
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId: string) => boardId === data.id), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const boardRef = Board.storeRef(this._inMemory, data.id);
      const boardSnap = await boardRef.get();
      const board = Board.storeData(boardSnap);

      const currentBoardStatusesIds = board.boardStatusesIds || [];
      const newBordStatusesIdsFromData = data.boardStatuses.filter((s) => s.id).map((s) => s.id) as string[];

      const boardStatusesIdsToRemove = currentBoardStatusesIds.toSet().difference(newBordStatusesIdsFromData.toSet());

      const boardStatusesRefsToRemove = [];

      for (const boardStatusIdToRemove of boardStatusesIdsToRemove) {
        boardStatusesRefsToRemove.push(BoardStatus.storeRef(boardSnap.reference, boardStatusIdToRemove));
      }

      const boardStatusesSnapsToRemovePromises: Promise<DocumentSnapshot>[] = [];

      for (const boardStatusesRefToRemove of boardStatusesRefsToRemove) {
        boardStatusesSnapsToRemovePromises.push(boardStatusesRefToRemove.get());
      }

      const boardStatusesSnapsToRemove = await Promise.all(boardStatusesSnapsToRemovePromises);

      const boardStatusesTasksRefsToRemove = [];

      for (const boardStatusSnapToRemove of boardStatusesSnapsToRemove) {
        writeBatch.delete(boardStatusSnapToRemove.reference);
        const boardStatus = BoardStatus.storeData(boardStatusSnapToRemove);
        boardStatusesTasksRefsToRemove.push(BoardTask.storeRefs(boardSnap.reference, boardStatus));
      }

      const boardStatusesTasksSnapsToRemovePromise: Promise<DocumentSnapshot>[] = [];

      for (const boardStatusTasksRefsToRemove of boardStatusesTasksRefsToRemove) {
        for (const boardStatusTasksRefToRemove of boardStatusTasksRefsToRemove) {
          boardStatusesTasksSnapsToRemovePromise.push(boardStatusTasksRefToRemove.get());
        }
      }

      const boardStatusesTasksSnapsToRemove = await Promise.all(boardStatusesTasksSnapsToRemovePromise);

      const tasksSubtasksSnapsToRemovePromise: Promise<DocumentSnapshot>[] = [];
      const tasksIdsToRemove = [];

      for (const boardStatusTaskSnapToRemove of boardStatusesTasksSnapsToRemove) {
        tasksIdsToRemove.push(boardStatusTaskSnapToRemove.id);
        writeBatch.delete(boardStatusTaskSnapToRemove.reference);
        const task = BoardTask.storeData(boardStatusTaskSnapToRemove);
        for (const tasksSubtasksRefsToRemove of BoardTaskSubtask.storeRefs(boardStatusTaskSnapToRemove.reference, task)) {
          tasksSubtasksSnapsToRemovePromise.push(tasksSubtasksRefsToRemove.get());
        }
      }

      const tasksSubtasksSnapsToRemove = await Promise.all(tasksSubtasksSnapsToRemovePromise);

      for (const tasksSubtasksSnapToRemove of tasksSubtasksSnapsToRemove) {
        writeBatch.delete(tasksSubtasksSnapToRemove.reference);
      }

      const boardStatusesRefs = [];

      for (let i = 0; i < data.boardStatuses.length; ++i) {
        const boardStatusId = data.boardStatuses[i].id;
        const boardStatusRef = BoardStatus.storeRef(boardSnap.reference, boardStatusId);
        boardStatusesRefs.push(boardStatusRef);
      }

      const boardStatusesSnapsPromise: Promise<DocumentSnapshot>[] = []

      for (const boardStatusesRef of boardStatusesRefs) {
        boardStatusesSnapsPromise.push(boardStatusesRef.get());
      }

      const boardStatusesSnaps = await Promise.all(boardStatusesSnapsPromise);
      const boardStatusesIds = [];

      for (const [i, boardStatusSnap] of boardStatusesSnaps.entries()) {

        if (!boardStatusSnap.exists) {

          const boardStatus = {
            name: data.boardStatuses[i].name,
            boardTasksIds: [] as string[]
          };

          writeBatch.create(boardStatusSnap.reference, boardStatus);
        } else {
          writeBatch.update(boardStatusSnap.reference, {
            name: data.boardStatuses[i].name
          });
        }

        boardStatusesIds.push(boardStatusSnap.id);
      }

      InMemoryError.testRequirement(boardStatusesIds.length > this._kanbanConfig.maxBoardStatuses, {
        code: 'resource-exhausted',
        message: `Board can have ${this._kanbanConfig.maxBoardStatuses} statuses`
      });

      const boardTasksIds = board.boardTasksIds.toSet().difference(tasksIdsToRemove.toSet()).toArray();

      writeBatch.update(boardSnap.reference, {
        name: data.name,
        boardStatusesIds,
        boardTasksIds
      });

      const userBoardRef = UserBoard.storeRef(userSnap.reference, boardSnap.id);
      const userBoardSnap = await userBoardRef.get();
      writeBatch.update(userBoardSnap.reference, {
        name: data.name
      });

      await writeBatch.commit();

      return {
        boardStatusesIds,
        boardTasksIds
      };

    }).pipe(
      tap(() => {
        this._snackBarService.open('Board has been updated', 3000);
      })
    );
  }

  boardTaskCreate(data: BoardTaskCreateData) {

    return this._Request<BoardTaskCreateResult>(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = User.storeRef(this._inMemory, this._userId);
      const userSnap = await userRef.get();
      const user = User.storeData(userSnap);
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId: string) => boardId === data.boardId), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const boardRef = Board.storeRef(this._inMemory, data.boardId);
      const boardSnap = await boardRef.get();
      const board = Board.storeData(boardSnap);

      InMemoryError.testRequirement(board.boardTasksIds.length >= this._kanbanConfig.maxBoardTasks, {
        code: 'resource-exhausted',
        message: `Board can have ${this._kanbanConfig.maxBoardTasks} tasks`
      });

      InMemoryError.testRequirement(!board.boardStatusesIds.toSet().has(data.boardStatusId), {
        code: 'not-found',
        message: 'Status do not exist'
      });

      InMemoryError.testRequirement(data.boardTaskSubtasksTitles.length > this._kanbanConfig.maxBoardTaskSubtasks, {
        code: 'resource-exhausted',
        message: `Board task can have ${this._kanbanConfig.maxBoardTaskSubtasks} subtasks`
      });

      const boardStatusRef = BoardStatus.storeRef(boardSnap.reference, data.boardStatusId);
      const boardStatusSnap = await boardStatusRef.get();
      const boardStatus = BoardStatus.storeData(boardStatusSnap);

      const boardTaskRef = BoardTask.storeRef(boardSnap.reference);

      const boardTasksIds = [boardTaskRef.id, ...board.boardTasksIds];
      const boardStatusBoardTasksIds = [boardTaskRef.id, ...boardStatus.boardTasksIds];

      writeBatch.update(boardSnap.reference, {
        boardTasksIds: boardTasksIds
      });

      writeBatch.update(boardStatusSnap.reference, {
        boardTasksIds: boardStatusBoardTasksIds
      });

      const boardTaskSubtasksIds: string[] = [];

      for (const boardTaskSubtaskTitle of data.boardTaskSubtasksTitles) {

        const boardTaskSubtaskRef = BoardTaskSubtask.storeRef(boardTaskRef);

        writeBatch.create(boardTaskSubtaskRef, {
          title: boardTaskSubtaskTitle,
          isCompleted: false
        });

        boardTaskSubtasksIds.push(boardTaskSubtaskRef.id);
      }

      const boardTask = {
        title: data.title,
        description: data.description,
        boardTaskSubtasksIds,
        boardStatusId: boardStatusSnap.id,
        completedBoardTaskSubtasks: 0
      };

      writeBatch.create(boardTaskRef, boardTask);

      await writeBatch.commit();

      return {
        id: boardTaskRef.id,
        boardTasksIds,
        boardStatusBoardTasksIds,
        boardTaskSubtasksIds
      };
    }).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been created', 3000);
      })
    );
  }

  boardTaskDelete(data: BoardTaskDeleteData): Observable<BoardTaskDeleteResult> {

    return this._Request<BoardTaskDeleteResult>(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = User.storeRef(this._inMemory, this._userId);
      const userSnap = await userRef.get();
      const user = User.storeData(userSnap);
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId: string) => boardId === data.boardId), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const boardRef = Board.storeRef(this._inMemory, data.boardId);
      const boardSnap = await boardRef.get();
      const board = Board.storeData(boardSnap);

      const boardTaskRef = BoardTask.storeRef(boardSnap.reference, data.id);
      const boardTaskSnap = await boardTaskRef.get();
      InMemoryError.testRequirement(!boardTaskSnap.exists, {code: 'not-found', message: 'Board task not found'});
      const boardTask = BoardTask.storeData(boardTaskSnap);

      const boardStatusId = boardTask.boardStatusId;
      const boardStatusRef = BoardStatus.storeRef(boardSnap.reference, boardStatusId);
      const boardStatusSnap = await boardStatusRef.get();
      const boardStatus = BoardStatus.storeData(boardStatusSnap);

      writeBatch.update(boardStatusSnap.reference, {
        boardTasksIds: boardStatus.boardTasksIds.toSet().difference([boardTaskSnap.id].toSet()).toArray()
      });

      writeBatch.delete(boardTaskSnap.reference);

      const boardSubtasksRefs = BoardTaskSubtask.storeRefs(boardTaskSnap.reference, boardTask);
      const boardSubtasksSnapsPromise: Promise<DocumentSnapshot>[] = [];

      for (const boardSubtasksRef of boardSubtasksRefs) {
        boardSubtasksSnapsPromise.push(boardSubtasksRef.get());
      }

      const boardSubtasksSnaps = await Promise.all(boardSubtasksSnapsPromise);

      for (const boardSubtasksSnap of boardSubtasksSnaps) {
        writeBatch.delete(boardSubtasksSnap.reference);
      }

      writeBatch.update(boardSnap.reference, {
        boardTasksIds: board.boardTasksIds.toSet().difference([boardTaskSnap.id].toSet()).toArray()
      });

      await writeBatch.commit();

    }).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been deleted', 3000);
      })
    );
  }

  boardTaskUpdate(data: BoardTaskUpdateData): Observable<BoardTaskUpdateResult> {

    return this._Request(async () => {

      const writeBatch = new WriteBatch(this._inMemory);

      const userRef = User.storeRef(this._inMemory, this._userId);
      const userSnap = await userRef.get();
      const user = User.storeData(userSnap);
      InMemoryError.testRequirement(user.disabled, {code: 'permission-denied', message: 'User is disabled'});
      InMemoryError.testRequirement(!user.boardsIds.find((boardId: string) => boardId === data.boardId), {
        code: 'permission-denied',
        message: 'User do not have access to this board'
      });

      const boardRef = Board.storeRef(this._inMemory, data.boardId);
      const boardSnap = await boardRef.get();

      const boardStatusRef = BoardStatus.storeRef(boardSnap.reference, data.boardStatus.id);
      const boardStatusSnap = await boardStatusRef.get();
      InMemoryError.testRequirement(!boardStatusSnap.exists, {code: 'not-found', message: 'Board status not found'});
      const boardStatus = BoardStatus.storeData(boardStatusSnap);

      const taskRef = BoardTask.storeRef(boardSnap.reference, data.id);
      const taskSnap = await taskRef.get();
      InMemoryError.testRequirement(!taskSnap.exists, {code: 'not-found', message: 'Board task not found'});
      const boardTask = BoardTask.storeData(taskSnap);

      let newBoardStatusSnap;
      if (data.boardStatus.newId) {

        writeBatch.update(boardStatusSnap.reference, {
          boardTasksIds: boardStatus.boardTasksIds.filter((boardTaskId) => boardTaskId !== data.id)
        });

        const newBoardStatusRef = BoardStatus.storeRef(boardSnap.reference, data.boardStatus.newId);
        newBoardStatusSnap = await newBoardStatusRef.get();
        InMemoryError.testRequirement(!newBoardStatusSnap.exists, {
          code: 'not-found',
          message: 'New board status not found'
        });
        const newBoardStatus = BoardStatus.storeData(newBoardStatusSnap);

        writeBatch.update(newBoardStatusSnap.reference, {
          boardTasksIds: [data.id, ...newBoardStatus.boardTasksIds]
        });
      }

      const currentBoardTaskSubtasksIds = boardTask.boardTaskSubtasksIds || [];
      const newBoardTaskSubtasksIds = data.boardTaskSubtasks.filter((s) => s.id).map((s) => s.id) as string[];

      const boardTaskSubtasksIdsToRemove = currentBoardTaskSubtasksIds.toSet().difference(newBoardTaskSubtasksIds.toSet());

      const boardTaskSubtasksRefsToRemove = [];

      for (const boardTaskSubtaskIdToRemove of boardTaskSubtasksIdsToRemove) {
        boardTaskSubtasksRefsToRemove.push(BoardTaskSubtask.storeRef(taskSnap.reference, boardTaskSubtaskIdToRemove));
      }

      const boardTaskSubtasksSnapsToRemovePromise: Promise<DocumentSnapshot>[] = [];

      for (const boardTaskSubtasksRefToRemove of boardTaskSubtasksRefsToRemove) {
        boardTaskSubtasksSnapsToRemovePromise.push(boardTaskSubtasksRefToRemove.get());
      }

      const boardTaskSubtasksSnapsToRemove = await Promise.all(boardTaskSubtasksSnapsToRemovePromise);

      for (const boardTaskSubtasksSnapToRemove of boardTaskSubtasksSnapsToRemove) {
        writeBatch.delete(boardTaskSubtasksSnapToRemove.reference);
      }

      const boardTaskSubtasksRefs = [];

      for (let i = 0; i < data.boardTaskSubtasks.length; ++i) {
        const boardTaskSubtaskId = data.boardTaskSubtasks[i].id;
        const boardTaskSubtaskRef = BoardTaskSubtask.storeRef(taskSnap.reference, boardTaskSubtaskId);
        boardTaskSubtasksRefs.push(boardTaskSubtaskRef);
      }

      const boardTaskSubtasksSnapsPromise: Promise<DocumentSnapshot>[] = [];

      for (const boardTaskSubtasksRef of boardTaskSubtasksRefs) {
        boardTaskSubtasksSnapsPromise.push(boardTaskSubtasksRef.get());
      }

      const boardTaskSubtasksSnaps = await Promise.all(boardTaskSubtasksSnapsPromise);
      const boardTaskSubtasksIds = [];

      for (const [i, boardTaskSubtaskSnap] of boardTaskSubtasksSnaps.entries()) {

        if (!boardTaskSubtaskSnap.exists) {
          const boardTaskSubtask = {
            title: data.boardTaskSubtasks[i].title,
            isCompleted: false
          };

          writeBatch.create(boardTaskSubtaskSnap.reference, boardTaskSubtask);
        } else {
          writeBatch.update(boardTaskSubtaskSnap.reference, {
            title: data.boardTaskSubtasks[i].title
          });
        }

        boardTaskSubtasksIds.push(boardTaskSubtaskSnap.id);
      }

      InMemoryError.testRequirement(boardTaskSubtasksIds.length > this._kanbanConfig.maxBoardTaskSubtasks, {
        code: 'resource-exhausted',
        message: `Board task can have ${this._kanbanConfig.maxBoardTaskSubtasks} subtasks`
      });

      writeBatch.update(taskSnap.reference, {
        title: data.title,
        description: data.description,
        boardTaskSubtasksIds,
        boardStatusId: newBoardStatusSnap ? newBoardStatusSnap.id : boardTask.boardStatusId
      });

      await writeBatch.commit();

      return {
        boardTaskSubtasksIds
      };

    }).pipe(
      tap(() => {
        this._snackBarService.open('Board task has been updated', 3000);
      })
    );
  }

  updateBoardTaskSubtaskIsCompleted(isCompleted: boolean, boardId: string, boardTaskId: string, boardTaskSubtaskId: string) {

    return this._Request(async () => {
      await Board.storeRef(this._inMemory, boardId).collection(boardTaskId).doc(boardTaskSubtaskId).update({
        isCompleted
      });
    });
  }

  loadDefault() {
    // this._inMemoryStore$.next({
    //   users: defaultInMemoryUsers,
    //   boards: defaultInMemoryBoards,
    // });
  }
}
