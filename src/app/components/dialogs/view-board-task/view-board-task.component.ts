import {Dialog, DialogRef} from '@angular/cdk/dialog';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {AsyncPipe} from '@angular/common';
import {Component, DestroyRef, inject, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BehaviorSubject, catchError, combineLatest, map, NEVER} from 'rxjs';
import {fadeZoomInOutTrigger} from '../../../animations/fade-zoom-in-out.trigger';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardTask, BoardTaskUpdateData} from '../../../models/board-task';
import {BoardTaskSubtask} from '../../../models/board-task-subtask';
import {BoardService} from '../../../services/board.service';
import {SnackBarService} from '../../../services/snack-bar.service';
import {handleTabIndex} from '../../../utils/handle-tabindex';
import {CheckboxComponent} from '../../form/checkbox/checkbox.component';
import {FormFieldComponent} from '../../form/form-field/form-field.component';
import {LabelComponent} from '../../form/label/label.component';
import {SelectComponent} from '../../form/select/select.component';
import {PopMenuItemComponent} from '../../pop-menu/pop-menu-item/pop-menu-item.component';
import {PopMenuItem} from '../../pop-menu/pop-menu-item/pop-menu-item.model';
import {PopMenuComponent} from '../../pop-menu/pop-menu.component';
import {DeleteBoardTaskComponent} from '../delete-board-task/delete-board-task.component';
import {EditBoardTaskComponent} from '../edit-board-task/edit-board-task.component';

type BoardTaskView = BoardTask & {
  boardTaskSubtasks: BoardTaskSubtask[]
};

@Component({
  selector: 'app-view-board-task',
  imports: [
    ReactiveFormsModule,
    SvgDirective,
    FormFieldComponent,
    LabelComponent,
    SelectComponent,
    CheckboxComponent,
    FormsModule,
    CdkConnectedOverlay,
    PopMenuComponent,
    PopMenuItemComponent,
    CdkOverlayOrigin,
    AsyncPipe
  ],
  templateUrl: './view-board-task.component.html',
  styleUrl: './view-board-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class ViewBoardTaskComponent implements OnInit, OnDestroy {

  private readonly _boardService = inject(BoardService);
  private readonly _dialogRef = inject(DialogRef<ViewBoardTaskComponent>);
  private readonly _dialog = inject(Dialog);
  private readonly _snackBarService = inject(SnackBarService);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly _isRequesting$ = new BehaviorSubject(false);

  protected readonly _boardTaskId$ = this._boardService.boardTaskId$;

  protected readonly _board$ = this._boardService.board$;
  protected readonly _boardStatuses$ = this._boardService.boardStatuses$;
  protected readonly _showMenuOptions$ = new BehaviorSubject(false);
  protected readonly _boardTask$ = this._boardService.boardTask$;
  protected readonly _boardTaskSubtasks$ = this._boardService.boardTaskSubtasks$;

  protected readonly _loadingUserBoards$ = this._boardService.loadingUserBoards$;
  protected readonly _loadingBoard$ = this._boardService.loadingBoard$;
  protected readonly _loadingBoardTasks$ = this._boardService.loadingBoardTasks$;
  protected readonly _loadingBoardStatuses$ = this._boardService.loadingBoardStatuses$;
  protected readonly _loadingBoardTaskSubtasks$ = this._boardService.loadingBoardTaskSubtasks$;

  protected readonly _modificationUserBoards$ = this._boardService.modificationUserBoards$;
  protected readonly _modificationBoard$ = this._boardService.modificationBoard$;
  protected readonly _modificationBoardTasks$ = this._boardService.modificationBoardTasks$;
  protected readonly _modificationBoardStatuses$ = this._boardService.modificationBoardStatuses$;

  protected get _showMenuOptions() {
    return this._showMenuOptions$.value;
  }

  protected readonly _boardStatusesPopMenuItems$ = combineLatest([
    this._board$,
    this._boardStatuses$,
    this._boardTask$,
    this._boardTaskSubtasks$
  ]).pipe(
    map(([
      board,
      boardStatuses,
      boardTask,
      boardTaskSubtasks
    ]) => {

      if (!board || !boardStatuses || !boardTask || !boardTaskSubtasks) {
        return [];
      }

      return board.boardStatusesIds.map((boardStatusId) => boardStatuses.get(boardStatusId)).filter((status) => !!status).map((status) => {
        return {
          value: status!.id,
          label: status!.name
        } as PopMenuItem;
      });
    })
  );

  protected readonly _boardTaskView$ = combineLatest([
    this._boardTask$,
    this._boardTaskSubtasks$,
    this._loadingBoardTaskSubtasks$
  ]).pipe(
    map(([
      boardTask,
      boardTaskSubtasks,
      loadingBoardTaskSubtasks
    ]) => {

      if (!boardTask || !boardTaskSubtasks || loadingBoardTaskSubtasks) {
        return null;
      }

      const boardTaskView: BoardTaskView = {
        ...boardTask,
        boardTaskSubtasks: []
      };

      for (const boardTaskSubtaskId of boardTask.boardTaskSubtasksIds) {

        const boardTaskSubtask = boardTaskSubtasks.get(boardTaskSubtaskId);

        if (!boardTaskSubtask) {
          continue;
        }

        boardTaskView.boardTaskSubtasks.push(boardTaskSubtask);
      }

      return boardTaskView;
    })
  );

  protected _newWindowWithTaskRequested = false;

  ngOnInit() {

    combineLatest([
      this._boardTaskId$,
      this._board$,
      this._boardStatuses$,
      this._loadingUserBoards$,
      this._loadingBoard$,
      this._loadingBoardTasks$,
      this._loadingBoardStatuses$,
      this._modificationUserBoards$,
      this._modificationBoard$,
      this._modificationBoardTasks$,
      this._modificationBoardStatuses$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef),
    ).subscribe(([
      boardTaskId,
      board,
      boardStatuses,
      loadingUserBoards,
      loadingBoard,
      loadingBoardTasks,
      loadingBoardStatuses,
      modificationUserBoards,
      modificationBoard,
      modificationBoardTasks,
      modificationBoardStatuses
    ]) => {

      if (
        boardTaskId === undefined ||
        loadingUserBoards ||
        loadingBoard ||
        loadingBoardTasks ||
        loadingBoardStatuses ||
        (modificationUserBoards && modificationUserBoards > 0) ||
        (modificationBoard && modificationBoard > 0) ||
        (modificationBoardTasks && modificationBoardTasks > 0) ||
        (modificationBoardStatuses && modificationBoardStatuses > 0)
      ) {
        return;
      }

      if (
        (!board && board !== undefined) ||
        (!boardStatuses && boardStatuses !== undefined)
      ) {
        this._snackBarService.open(`This board want's found`, 3000);
        this.close();
        return;
      }

      if (!board || !boardStatuses) {
        return;
      }

      const boardTask = this._boardTask$.value;

      if (!boardTask && boardTask !== undefined) {
        this._snackBarService.open(`This board task want's found`, 3000);
        this.close();
        return;
      }
    });
  }

  updateBoardTaskSubtaskIsCompleted($event: MouseEvent, boardTaskSubtaskId: string, isCompleted: boolean) {

    $event.preventDefault();
    $event.stopPropagation();

    const board = this._board$.value;
    const boardTask = this._boardTask$.value;

    if (!board || !boardTask) {
      return
    }

    this._boardService.updateBoardTaskSubtaskIsCompleted(isCompleted, board.id, boardTask.id, boardTaskSubtaskId).subscribe();
  }

  onBoardTaskStatusIdChange(newBoardStatusId: string) {

    if (this._isRequesting$.value) {
      return;
    }

    const board = this._board$.value;
    const boardTask = this._boardTask$.value;
    const boardTaskSubtasks = this._boardTaskSubtasks$.value;

    if (!board || !boardTask || !boardTaskSubtasks) {
      return;
    }

    const currentBoardStatusId = this._boardTask$.value!.boardStatusId;

    if (currentBoardStatusId === newBoardStatusId) {
      return;
    }

    const updateTaskData: BoardTaskUpdateData = {
      id: boardTask.id,
      boardId: board.id,
      description: boardTask.description,
      title: boardTask.title,
      boardStatus: {
        id: currentBoardStatusId,
        newId: newBoardStatusId
      },
      boardTaskSubtasks: boardTask.boardTaskSubtasksIds.map((boardTaskSubtaskId) => boardTaskSubtasks.get(boardTaskSubtaskId)).filter((boardTaskSubtask) => !!boardTaskSubtask).map((boardTaskSubtask) => ({
        id: boardTaskSubtask!.id,
        title: boardTaskSubtask!.title
      }))
    };

    this._isRequesting$.next(true);

    this._boardService.boardTaskUpdate(updateTaskData).pipe(
      catchError(() => NEVER)
    ).subscribe(() => {

      try {
        this._isRequesting$.next(false);
      } catch {
        /* empty */
      }
    });
  }

  openBoardTaskEditDialog($event: KeyboardEvent | MouseEvent) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    const boardTask = this._boardTask$.value;

    if (boardTask) {
      this._newWindowWithTaskRequested = true;
      this._boardService.boardTaskId$.next(boardTask.id);
      this._dialog.open(EditBoardTaskComponent);

      this.close();
    }
  }

  openBoardTaskDeleteDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    const boardTask = this._boardTask$.value;

    if (boardTask) {
      this._newWindowWithTaskRequested = true;
      this._boardService.boardTaskId$.next(boardTask.id);
      this._dialog.open(DeleteBoardTaskComponent);

      this.close();
    }
  }

  setShowMenuOptions($event: KeyboardEvent | MouseEvent, showMenuOptions: boolean) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    if ($event instanceof KeyboardEvent) {
      if ($event.code !== 'Space' && $event.code !== 'Enter') {
        return;
      }
    }

    this._showMenuOptions$.next(showMenuOptions);
  }

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }

  ngOnDestroy(): void {
    if (!this._newWindowWithTaskRequested) {
      this._boardService.boardTaskId$.next(null);
    }
  }
}
