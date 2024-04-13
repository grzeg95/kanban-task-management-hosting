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
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router} from '@angular/router';
import {map} from 'rxjs';
import {AppService} from '../../services/app.service';
import {BoardsService} from '../../services/boards/boards.service';
import {LayoutService} from '../../services/layout.service';
import {Color} from '../../utils/color';
import {handleTabIndex} from '../../utils/handle-tabindex';
import {ButtonComponent} from '../button/button.component';
import {EditBoardComponent} from '../dialogs/edit-board/edit-board.component';
import {ViewTaskComponent} from '../dialogs/view-task/view-task.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    NgStyle,
    ButtonComponent
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

  protected board = toSignal(this._boardsService.board$);
  protected boardStatuses = toSignal(this._boardsService.boardStatuses$);
  protected boardTasks = toSignal(this._boardsService.boardTasks$);

  protected selectingBoard = toSignal(this._boardsService.selectingBoard$);
  protected selectingBoardStatuses = toSignal(this._boardsService.selectingBoardStatuses$);
  protected selectingBoardTasks = toSignal(this._boardsService.selectingBoardTasks$);

  protected isBoardLoaded = computed(() => {

    const selectingBoard = this.selectingBoard();
    const selectingBoardStatuses = this.selectingBoardStatuses();
    const selectingBoardTasks = this.selectingBoardTasks();

    return !(selectingBoard || selectingBoardStatuses || selectingBoardTasks);
  });

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
    private readonly _boardsService: BoardsService,
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
      this._boardsService.boardId = id;
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

  openTaskDialog($event: KeyboardEvent | MouseEvent, statusId: string, taskId: string) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(ViewTaskComponent, {
      data: {
        _boardsService: this._boardsService,
        statusId,
        taskId
      }
    });
  }

  openNewStatusDialog($event: KeyboardEvent | MouseEvent) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditBoardComponent, {
      data: {
        _boardsService: this._boardsService
      }
    });
  }

  openEditBoardDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditBoardComponent, {
      data: {
        _boardsService: this._boardsService
      }
    });
  }

  colorShift(progress: number): string {
    return Color.shift(this.statusesColorStart, this.statusesColorEnd, progress || 0).toRgbString();
  }

  ngOnDestroy() {
    this._boardsService.boardId = undefined;
  }
}
