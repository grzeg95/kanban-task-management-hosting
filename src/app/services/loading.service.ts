import {Injectable} from '@angular/core';
import {combineLatest, map} from 'rxjs';
import {AuthService} from './auth.service';
import {BoardService} from './board.service';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  readonly appLoading$ = combineLatest([
    this._authService.authStateReady$,
    this._authService.loadingUser$,
    this._boardService.loadingUserBoards$,
    this._boardService.loadingBoard$,
    this._boardService.loadingBoardStatuses$,
    this._boardService.loadingBoardTasks$,
    this._boardService.loadingBoardTaskSubtasks$,
    this._boardService.modificationUserBoards$,
    this._boardService.modificationBoard$,
    this._boardService.modificationBoardStatuses$,
    this._boardService.modificationBoardTasks$,
    this._boardService.modificationBoardTaskSubtasks$
  ]).pipe(
    map(([
      authStateReady,
      loadingUser,
      loadingUserBoards,
      loadingBoard,
      loadingBoardStatuses,
      loadingBoardTasks,
      loadingBoardTaskSubtasks,
      modificationUserBoards,
      modificationBoard,
      modificationBoardStatuses,
      modificationBoardTasks,
      modificationBoardTaskSubtasks
    ]) => {

      return [
        !authStateReady,
        loadingUser,
        loadingUserBoards,
        loadingBoard,
        loadingBoardStatuses,
        loadingBoardTasks,
        loadingBoardTaskSubtasks,
        modificationUserBoards && modificationUserBoards > 0,
        modificationBoard && modificationBoard > 0,
        modificationBoardStatuses && modificationBoardStatuses > 0,
        modificationBoardTasks && modificationBoardTasks > 0,
        modificationBoardTaskSubtasks && modificationBoardTaskSubtasks > 0,
      ].some((val) => !!val);
    })
  );

  constructor(
    private readonly _authService: AuthService,
    private readonly _boardService: BoardService
  ) {
  }
}
