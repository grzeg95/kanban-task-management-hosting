import {Injectable} from '@angular/core';
import {filter, map, shareReplay, switchMap, take} from 'rxjs';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {AuthService} from '../auth/auth.service';
import {ObservedValuesOfBoardService} from './board-service.abstract';
import {FirebaseBoardService} from './firebase-board.service';
import {StorageBoardService} from './storage-board.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {

  storeType$ = this._authService.isLoggedIn$.pipe(
    getProtectedRxjsPipe(),
    filter((isLoggedIn): isLoggedIn is boolean => isLoggedIn !== undefined),
    map((isLoggedIn) => isLoggedIn ? 'firebase' : 'storage')
  );

  abstractBoardService$ = this.storeType$.pipe(
    getProtectedRxjsPipe(),
    map((storeType) => {
      if (storeType === 'firebase') {
        return this._firebaseBoardService;
      }
      return this._storageBoardService;
    })
  );

  config$ = this._getObservedValueOf('config$');

  boardId$ = this._getObservedValueOf('boardId$');
  user$ = this._getObservedValueOf('user$');
  userBoards$ = this._getObservedValueOf('userBoards$');
  board$ = this._getObservedValueOf('board$');
  // darkMode$ = this.user$.pipe(map((user) => user?.darkMode));
  boardStatuses$ = this._getObservedValueOf('boardStatuses$');
  boardTasks$ = this._getObservedValueOf('boardTasks$');
  boardTask$ = this._getObservedValueOf('boardTask$');
  boardTaskSubtasks$ = this._getObservedValueOf('boardTaskSubtasks$');

  loadingUserBoards$ = this._getObservedValueOf('loadingUserBoards$');
  loadingBoard$ = this._getObservedValueOf('loadingBoard$');
  loadingBoardStatuses$ = this._getObservedValueOf('loadingBoardStatuses$');
  loadingBoardTasks$ = this._getObservedValueOf('loadingBoardTasks$');
  loadingBoardTask$ = this._getObservedValueOf('loadingBoardTask$');
  loadingBoardTaskSubtasks$ = this._getObservedValueOf('loadingBoardTaskSubtasks$');

  firstLoadingUserBoards$ = this._getObservedValueOf('firstLoadingUserBoards$');
  firstLoadingBoard$ = this._getObservedValueOf('firstLoadingBoard$');
  firstLoadingBoardStatuses$ = this._getObservedValueOf('firstLoadingBoardStatuses$');
  firstLoadingBoardTasks$ = this._getObservedValueOf('firstLoadingBoardTasks$');
  firstLoadingBoardTask$ = this._getObservedValueOf('firstLoadingBoardTask$');
  firstLoadingBoardTaskSubtasks$ = this._getObservedValueOf('firstLoadingBoardTaskSubtasks$');

  set boardId(boardId: string | undefined) {
    this.abstractBoardService$.pipe(take(1)).subscribe((abstractBoardService) => {
      abstractBoardService.boardId$.next(boardId)
    });
  }

  set boardTaskId(boardTaskId: string | undefined) {
    this.abstractBoardService$.pipe(take(1)).subscribe((abstractBoardService) => {
      abstractBoardService.boardTaskId$.next(boardTaskId)
    });
  }

  constructor(
    private readonly _firebaseBoardService: FirebaseBoardService,
    private readonly _storageBoardService: StorageBoardService,
    private readonly _authService: AuthService
  ) {
    this._authService.resetFirstLoadings$.subscribe(() => {
      this.abstractBoardService$.pipe(take(1)).subscribe((abstractBoardService) => {
        abstractBoardService.firstLoadingUserBoards$.next(true);
        abstractBoardService.firstLoadingBoard$.next(true);
        abstractBoardService.firstLoadingBoardStatuses$.next(true);
        abstractBoardService.firstLoadingBoardTasks$.next(true);
        abstractBoardService.firstLoadingBoardTask$.next(true);
        abstractBoardService.firstLoadingBoardTaskSubtasks$.next(true);
      });
    });
  }

  private _getObservedValueOf<T extends ObservedValuesOfBoardService>(observedValuesOf: T) {
    return this.storeType$.pipe(
      getProtectedRxjsPipe(),
      switchMap((storeType) => {
        if (storeType === 'firebase') {
          return this._firebaseBoardService[observedValuesOf];
        }
        return this._storageBoardService[observedValuesOf];
      }),
      shareReplay()
    );
  }
}
