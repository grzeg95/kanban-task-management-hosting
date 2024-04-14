import {Dialog} from '@angular/cdk/dialog';
import {JsonPipe, NgStyle} from '@angular/common';
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
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router} from '@angular/router';
import {map} from 'rxjs';
import {AppService} from '../../services/app.service';
import {BoardService} from '../../services/board/board.service';
import {LayoutService} from '../../services/layout.service';
import {Color} from '../../utils/color';
import {handleTabIndex} from '../../utils/handle-tabindex';
import {ButtonComponent} from '../button/button.component';
import {EditBoardComponent} from '../dialogs/edit-board/edit-board.component';
import {ViewBoardTaskComponent} from '../dialogs/view-board-task/view-board-task.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    NgStyle,
    ButtonComponent,
    JsonPipe
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

  protected statusesColorStart = Color.hexStringColorToColor('#285be0');
  protected statusesColorEnd = Color.hexStringColorToColor('#5bda6b');

  protected showSideBar = toSignal(this._appService.showSideBar$);

  protected heightNav = toSignal(this._layoutService.heightNav$);
  protected isOnPhone = toSignal(this._layoutService.isOnPhone$);

  protected board = toSignal(this._boardService.board$);
  protected boardStatuses = toSignal(this._boardService.boardStatuses$);
  protected boardTasks = toSignal(this._boardService.boardTasks$);

  protected selectingBoard = toSignal(this._boardService.selectingBoard$);
  protected selectingBoardStatuses = toSignal(this._boardService.selectingBoardStatuses$);
  protected selectingBoardTasks = toSignal(this._boardService.selectingBoardTasks$);

  protected tabIndex = computed(() => {

    const isOnPhone = this.isOnPhone();
    const showSideBar = this.showSideBar();

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

      const selectingBoard = this.selectingBoard();
      const board = this.board();
      let height = '';

      if (!selectingBoard && board) {
        if (board.boardStatusesIds.length === 0) {
          height = '100%';
        }
      } else {
        height = '100%';
      }

      this.height = height;
      this._cdr.markForCheck();
    });

    this._activatedRoute.params.pipe(
      map((params) => params['id'])
    ).subscribe((id) => {
      this._boardService.boardId = id;
    });

    effect(() => {

      const board = this.board();
      const selectingBoard = this.selectingBoard();

      if (selectingBoard === undefined) {
        return;
      }

      if (!board && !selectingBoard) {
        this._router.navigate(['/']);
      }
    });
  }

  openTaskDialog($event: KeyboardEvent | MouseEvent, boardTaskId: string) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._boardService.boardTaskId = boardTaskId;
    this._dialog.open(ViewBoardTaskComponent);
  }

  openEditBoardDialog($event: KeyboardEvent | MouseEvent) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditBoardComponent);
  }

  colorShift(progress: number): string {
    return Color.shift(this.statusesColorStart, this.statusesColorEnd, progress || 0).toRgbString();
  }

  ngOnDestroy() {
    this._boardService.boardId = undefined;
  }
}
