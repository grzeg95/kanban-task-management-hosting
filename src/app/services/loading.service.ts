import {computed, Injectable} from '@angular/core';
import {AuthService} from './auth.service';
import {BoardService} from './board.service';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  protected readonly _loadingUserBoards = this._boardService.loadingUserBoardsSig.get();
  protected readonly _loadingBoard = this._boardService.loadingBoardSig.get();
  protected readonly _loadingBoardStatuses = this._boardService.loadingBoardStatusesSig.get();
  protected readonly _loadingBoardTasks = this._boardService.loadingBoardTasksSig.get();
  protected readonly _loadingBoardTaskSubtasks = this._boardService.loadingBoardTaskSubtasksSig.get();

  protected readonly _modificationUserBoards = this._boardService.modificationUserBoardsSig.get();
  protected readonly _modificationBoard = this._boardService.modificationBoardSig.get();
  protected readonly _modificationBoardStatuses = this._boardService.modificationBoardStatusesSig.get();
  protected readonly _modificationBoardTasks = this._boardService.modificationBoardTasksSig.get();
  protected readonly _modificationBoardTaskSubtasks = this._boardService.modificationBoardTaskSubtasksSig.get();

  protected readonly _authStateReady = this._authService.authStateReady;
  protected readonly _whileLoginIn = this._authService.whileLoginInSig.get();

  readonly appLoading = computed(() => {

    const whileLoginIn = this._whileLoginIn();
    const authStateReady = this._authStateReady();

    const loadingUserBoards = this._loadingUserBoards();
    const loadingBoard = this._loadingBoard();
    const loadingBoardStatuses = this._loadingBoardStatuses();
    const loadingBoardTasks = this._loadingBoardTasks();
    const loadingBoardTaskSubtasks = this._loadingBoardTaskSubtasks();

    const modificationUserBoards = this._modificationUserBoards();
    const modificationBoard = this._modificationBoard();
    const modificationBoardStatuses = this._modificationBoardStatuses();
    const modificationBoardTasks = this._modificationBoardTasks();
    const modificationBoardTaskSubtasks = this._modificationBoardTaskSubtasks();

    return [
      whileLoginIn,
      !authStateReady,
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
  });

  constructor(
    private readonly _authService: AuthService,
    private readonly _boardService: BoardService
  ) {
  }
}
