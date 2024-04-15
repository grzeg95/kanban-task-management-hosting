import {Injectable} from '@angular/core';
import {filter, map, shareReplay, switchMap} from 'rxjs';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {AuthService} from '../auth/auth.service';
import {ObservedValuesOfBoardService} from './board-service.abstract';
import {FirebaseBoardService} from './firebase-board.service';
import {InMemoryBoardService} from './in-memory-board.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  storeType$ = this._authService.isLoggedIn$.pipe(
    getProtectedRxjsPipe(),
    filter((isLoggedIn): isLoggedIn is boolean => isLoggedIn !== undefined),
    map((isLoggedIn) => isLoggedIn ? 'firebase' : 'in-memory')
  );

  abstractBoardService$ = this.storeType$.pipe(
    getProtectedRxjsPipe(),
    map((storeType) => {
      if (storeType === 'firebase') {
        return this._firebaseBoardService;
      }
      return this._inMemoryBoardService;
    })
  );

  boardId$ = this._getObservedValueOf('boardId$');
  user$ = this._getObservedValueOf('user$');
  userBoards$ = this._getObservedValueOf('userBoards$');
  board$ = this._getObservedValueOf('board$');
  darkMode$ = this.user$.pipe(map((user) => user?.darkMode));
  boardStatuses$ = this._getObservedValueOf('boardStatuses$');
  boardTasks$ = this._getObservedValueOf('boardTasks$');
  boardTask$ = this._getObservedValueOf('boardTask$');
  boardTaskSubtasks$ = this._getObservedValueOf('boardTaskSubtasks$');

  loadingUser$ = this._getObservedValueOf('loadingUser$');
  loadingUserBoards$ = this._getObservedValueOf('loadingUserBoards$');
  loadingBoard$ = this._getObservedValueOf('loadingBoard$');
  loadingBoardStatuses$ = this._getObservedValueOf('loadingBoardStatuses$');
  loadingBoardTasks$ = this._getObservedValueOf('loadingBoardTasks$');
  loadingBoardTask$ = this._getObservedValueOf('loadingBoardTask$');
  loadingBoardTaskSubtasks$ = this._getObservedValueOf('loadingBoardTaskSubtasks$');

  set boardId(boardId: string | undefined) {
    this._firebaseBoardService.boardId$.next(boardId);
    this._inMemoryBoardService.boardId$.next(boardId);
    this._firebaseBoardService.loadingBoard$.next(true);
    this._inMemoryBoardService.loadingBoard$.next(true);
    this._firebaseBoardService.loadingBoardStatuses$.next(true);
    this._inMemoryBoardService.loadingBoardStatuses$.next(true);
    this._firebaseBoardService.loadingBoardTasks$.next(true);
    this._inMemoryBoardService.loadingBoardTasks$.next(true);
  }

  set boardTaskId(boardTaskId: string | undefined) {
    this._firebaseBoardService.boardTaskId$.next(boardTaskId);
    this._inMemoryBoardService.boardTaskId$.next(boardTaskId);
    this._firebaseBoardService.loadingBoardTask$.next(true);
    this._inMemoryBoardService.loadingBoardTask$.next(true);
    this._firebaseBoardService.loadingBoardTaskSubtasks$.next(true);
    this._inMemoryBoardService.loadingBoardTaskSubtasks$.next(true);
  }

  constructor(
    private readonly _firebaseBoardService: FirebaseBoardService,
    private readonly _inMemoryBoardService: InMemoryBoardService,
    private readonly _authService: AuthService
  ) {
  }

  private _getObservedValueOf<T extends ObservedValuesOfBoardService>(observedValuesOf: T) {
    return this.storeType$.pipe(
      getProtectedRxjsPipe(),
      switchMap((storeType) => {
        if (storeType === 'firebase') {
          return this._firebaseBoardService[observedValuesOf];
        }
        return this._inMemoryBoardService[observedValuesOf];
      }),
      shareReplay()
    );
  }
}
