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
import {AppService} from '../../services/app.service';
import {BoardService} from '../../services/board.service';
import {LayoutService} from '../../services/layout.service';
import {Color} from '../../utils/color';
import {handleTabIndex} from '../../utils/handle-tabindex';
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
  }
})
export class BoardComponent implements OnDestroy {

  @HostBinding('style.height') height = '';
  @HostBinding('style.width') width = '';

  private readonly _statusesColorStart = Color.hexStringColorToColor('#285be0');
  private readonly _statusesColorEnd = Color.hexStringColorToColor('#5bda6b');

  protected readonly _showSideBar = this._appService.showSideBarSig.get();

  protected readonly _heightNav = this._layoutService.heightNavSig.get();
  protected readonly _isOnPhone = this._layoutService.isOnPhoneSig.get();

  protected readonly _board = this._boardService.boardSig.get();
  protected readonly _boardStatuses = this._boardService.boardStatusesSig.get();
  protected readonly _boardTasks = this._boardService.boardTasksSig.get();

  protected readonly _loadingBoard = this._boardService.firstLoadingBoardSig.get();
  protected readonly _firstLoadingBoard = this._boardService.firstLoadingBoardSig.get();
  protected readonly _firstLoadingBoardStatuses = this._boardService.firstLoadingBoardStatusesSig.get();
  protected readonly _firstLoadingBoardTasks = this._boardService.firstLoadingBoardTasksSig.get();

  protected readonly _tabIndex = computed(() => {

    const isOnPhone = this._isOnPhone();
    const showSideBar = this._showSideBar();

    if (isOnPhone && showSideBar) {
      return -1;
    }

    return 0;
  });

  constructor(
    private readonly _appService: AppService,
    private readonly _boardService: BoardService,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _router: Router,
    private readonly _layoutService: LayoutService,
    private readonly _dialog: Dialog,
    private readonly _cdr: ChangeDetectorRef,
    _destroyRef: DestroyRef
  ) {

    effect(() => {

      const loadingBoard = this._loadingBoard();
      const board = this._board();
      let height = '';
      let width = '';

      if (!loadingBoard && board) {
        if (board.boardStatusesIds.length === 0) {
          height = '100%';
          width = '100%';
        }
      } else {
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
      this._boardService.boardIdSig.set(id);
    });

    effect(() => {

      const board = this._board();
      const loadingBoard = this._loadingBoard();

      if (board === undefined || loadingBoard === undefined) {
        return;
      }

      if (!board && !loadingBoard) {
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

  ngOnDestroy() {
    this._boardService.boardIdSig.set(undefined);
  }
}
