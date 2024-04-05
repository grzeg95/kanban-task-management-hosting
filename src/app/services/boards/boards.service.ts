import {Injectable} from '@angular/core';
import {filter, map, switchMap} from 'rxjs';
import {getProtectedRxjsPipe} from '../../utils/get-protected.rxjs-pipe';
import {AuthService} from '../auth/auth.service';
import {ObservedValuesOfBoardsService} from './boards-service.types';
import {FirebaseBoardsService} from './firebase-boards.service';
import {InMemoryBoardsService} from './in-memory-boards.service';

@Injectable({
  providedIn: 'root'
})
export class BoardsService {

  storeType$ = this._authService.isLoggedIn$.pipe(
    getProtectedRxjsPipe(),
    filter((isLoggedIn): isLoggedIn is boolean => isLoggedIn !== undefined),
    map((isLoggedIn) => isLoggedIn ? 'firebase' : 'in-memory')
  );

  abstractBoardsService$ = this.storeType$.pipe(
    getProtectedRxjsPipe(),
    map((storeType) => {
      if (storeType === 'firebase') {
        return this._firebaseBoardsService;
      }
      return this._inMemoryBoardsService;
    })
  );

  boards$ = this._getObservedValueOf('user$').pipe(map((user) => user?.boards));
  board$ = this._getObservedValueOf('board$');
  boardId$ = this._getObservedValueOf('boardId$');
  user$ = this._getObservedValueOf('user$');
  selectingBoard$ = this._getObservedValueOf('selectingBoard$');

  set boardId(boardId: string | undefined) {
    this._firebaseBoardsService.boardId$.next(boardId);
    this._inMemoryBoardsService.boardId$.next(boardId);
    this._firebaseBoardsService.selectingBoard$.next(true);
    this._inMemoryBoardsService.selectingBoard$.next(true);
  }

  constructor(
    private readonly _firebaseBoardsService: FirebaseBoardsService,
    private readonly _inMemoryBoardsService: InMemoryBoardsService,
    private readonly _authService: AuthService
  ) {
  }

  private _getObservedValueOf<T extends ObservedValuesOfBoardsService>(observedValuesOf: T) {
    return this.storeType$.pipe(
      getProtectedRxjsPipe(),
      switchMap((storeType) => {
        if (storeType === 'firebase') {
          return this._firebaseBoardsService[observedValuesOf];
        }
        return this._inMemoryBoardsService[observedValuesOf];
      }),
    );
  }
}
