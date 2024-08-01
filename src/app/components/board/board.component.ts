import {Dialog} from '@angular/cdk/dialog';
import {NgStyle} from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  HostBinding,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {map} from 'rxjs';
import {fadeZoomInOutTrigger} from '../../animations/fade-zoom-in-out.trigger';
import {AuthService} from '../../services/auth.service';
import {BoardService} from '../../services/board.service';
import {LayoutService} from '../../services/layout.service';
import {Color} from '../../utils/color';
import {handleTabIndex} from '../../utils/handle-tabindex';
import {Sig} from '../../utils/Sig';
import {ButtonComponent} from '../button/button.component';
import {EditBoardComponent} from '../dialogs/edit-board/edit-board.component';
import {ViewBoardTaskComponent} from '../dialogs/view-board-task/view-board-task.component';
import {LoadingComponent} from '../loading/loading.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    NgStyle,
    ButtonComponent,
    LoadingComponent
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-board'
  },
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class BoardComponent implements OnDestroy {

  @HostBinding('style.height') height = '';
  @HostBinding('style.width') width = '';

  private readonly _statusesColorStart = Color.hexStringColorToColor('#285be0');
  private readonly _statusesColorEnd = Color.hexStringColorToColor('#5bda6b');

  protected readonly _user = this._authService.userSig.get();
  protected readonly _authStateReady = this._authService.authStateReady;
  readonly loadedSig = new Sig(false);
  protected readonly _loaded = this.loadedSig.get();

  protected readonly _showSideBar = this._layoutService.showSideBarSig.get();

  protected readonly _heightNav = this._layoutService.heightNavSig.get();
  protected readonly _isOnPhone = this._layoutService.isOnPhoneSig.get();

  protected readonly _board = this._boardService.boardSig.get();
  protected readonly _boardStatuses = this._boardService.boardStatusesSig.get();
  protected readonly _boardTasks = this._boardService.boardTasksSig.get();

  protected readonly _loadingBoard = this._boardService.loadingBoardSig.get();
  protected readonly _loadingBoardStatuses = this._boardService.loadingBoardStatusesSig.get();
  protected readonly _loadingBoardTasks = this._boardService.loadingBoardTasksSig.get();

  protected readonly _tabIndex = computed(() => {

    const isOnPhone = this._isOnPhone();
    const showSideBar = this._showSideBar();

    if (isOnPhone && showSideBar) {
      return -1;
    }

    return 0;
  });

  constructor(
    private readonly _boardService: BoardService,
    private readonly _authService: AuthService,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _router: Router,
    private readonly _layoutService: LayoutService,
    private readonly _dialog: Dialog,
    private readonly _cdr: ChangeDetectorRef,
    _destroyRef: DestroyRef
  ) {

    effect(() => {

      const loadingBoard = this._loadingBoard();
      const loadingBoardStatuses = this._loadingBoardStatuses();
      const loadingBoardTasks = this._loadingBoardTasks();

      let height = '';
      let width = '';

      if (loadingBoard || loadingBoardStatuses || loadingBoardTasks) {
        height = '100%';
        width = '100%';
      }

      this.height = height;
      this.width = width;
      this._cdr.markForCheck();
    });

    this._activatedRoute.params.pipe(
      map((params) => params['id'])
    ).subscribe((id) => {

      const loaded = this._loaded();

      if (loaded) {
        this.loadedSig.set(false);
        return;
      }

      const authStateReady = this._authStateReady();
      const user = this._user();

      if (loaded && authStateReady && !user) {
        this._router.navigate(['/']);
        return;
      }

      this._boardService.boardIdSig.set(id);
    });

    effect(() => {

      const loadingBoard = this._loadingBoard();
      const loadingBoardStatuses = this._loadingBoardStatuses();
      const loadingBoardTasks = this._loadingBoardTasks();

      const board = this._board();

      if (!loadingBoard || !loadingBoardStatuses || !loadingBoardTasks) {
        return;
      }

      if (!board && !loadingBoard) {
        this.loadedSig.set(true);
        this._router.navigate(['/']);
      }
    });
  }

  openTaskDialog($event: KeyboardEvent | MouseEvent, boardTaskId: string) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._boardService.boardTaskIdSig.set(boardTaskId);
    this._dialog.open(ViewBoardTaskComponent);
  }

  openEditBoardDialog($event: KeyboardEvent | MouseEvent) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditBoardComponent);
  }

  colorShift(progress: number): string {
    return Color.shift(this._statusesColorStart, this._statusesColorEnd, progress || 0).toRgbString();
  }

  getBoardStatus(boardStatusId: string) {
    return this._boardStatuses()?.get(boardStatusId);
  }

  getBoardStatusTask(boardStatusTaskId: string) {
    return this._boardTasks()?.get(boardStatusTaskId);
  }

  ngOnDestroy() {
    this._boardService.boardIdSig.set(undefined);
  }
}
