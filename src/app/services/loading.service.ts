import {computed, Injectable} from '@angular/core';
import {AuthService} from './auth.service';
import {BoardService} from './board.service';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {

  protected readonly _loadingUserBoards = this._boardService.loadingUserBoardsSig.get();
  protected readonly _loadingBoard = this._boardService.loadingBoardSig.get();
  protected readonly _loadingBoardTasks = this._boardService.loadingBoardTasksSig.get();
  protected readonly _authStateReady = this._authService.authStateReady;
  protected readonly _whileLoginIn = this._authService.whileLoginInSig.get();

  readonly appLoading = computed(() => {

    const loadingUserBoards = this._loadingUserBoards();
    const loadingBoard = this._loadingBoard();
    const loadingBoardTasks = this._loadingBoardTasks();
    const whileLoginIn = this._whileLoginIn();
    const authStateReady = this._authStateReady();

    return [
      loadingUserBoards,
      loadingBoard,
      loadingBoardTasks,
      whileLoginIn,
      !authStateReady
    ].some((val) => val);
  });

  constructor(
    private readonly _authService: AuthService,
    private readonly _boardService: BoardService
  ) {
  }
}
