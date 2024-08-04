import {Dialog, DialogRef} from '@angular/cdk/dialog';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {JsonPipe} from '@angular/common';
import {Component, computed, effect, OnDestroy, signal, ViewEncapsulation} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {catchError, NEVER, of} from 'rxjs';
import {fadeZoomInOutTrigger} from '../../../animations/fade-zoom-in-out.trigger';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardTask, BoardTaskUpdateData} from '../../../models/board-task';
import {BoardTaskSubtask} from '../../../models/board-task-subtask';
import {BoardService} from '../../../services/board.service';
import {SnackBarService} from '../../../services/snack-bar.service';
import {handleTabIndex} from '../../../utils/handle-tabindex';
import {Sig} from '../../../utils/Sig';
import {ButtonComponent} from '../../button/button.component';
import {CheckboxComponent} from '../../form/checkbox/checkbox.component';
import {ErrorComponent} from '../../form/error/error.component';
import {FormFieldComponent} from '../../form/form-field/form-field.component';
import {InputComponent} from '../../form/input/input.component';
import {LabelComponent} from '../../form/label/label.component';
import {SelectComponent} from '../../form/select/select.component';
import {TextareaComponent} from '../../form/textarea/textarea.component';
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
  standalone: true,
  imports: [
    InputComponent,
    ButtonComponent,
    ReactiveFormsModule,
    SvgDirective,
    FormFieldComponent,
    LabelComponent,
    ErrorComponent,
    TextareaComponent,
    SelectComponent,
    CheckboxComponent,
    FormsModule,
    CdkConnectedOverlay,
    PopMenuComponent,
    PopMenuItemComponent,
    CdkOverlayOrigin,
    JsonPipe
  ],
  templateUrl: './view-board-task.component.html',
  styleUrl: './view-board-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class ViewBoardTaskComponent implements OnDestroy {

  protected readonly _isRequesting = signal(false);

  protected readonly _boardTaskId = this._boardService.boardTaskIdSig.get();

  protected readonly _board = this._boardService.boardSig.get();
  protected readonly _boardStatuses = this._boardService.boardStatusesSig.get();
  protected readonly _showMenuOptions = signal(false);
  protected readonly _boardTask = this._boardService.boardTaskSig.get();
  protected readonly _boardTaskSubtasks = this._boardService.boardTaskSubtasksSig.get();

  protected readonly _loadingUserBoards = this._boardService.loadingUserBoardsSig.get();
  protected readonly _loadingBoard = this._boardService.loadingBoardSig.get();
  protected readonly _loadingBoardTasks = this._boardService.loadingBoardTasksSig.get();
  protected readonly _loadingBoardStatuses = this._boardService.loadingBoardStatusesSig.get();
  protected readonly _loadingBoardTaskSubtasks = this._boardService.loadingBoardTaskSubtasksSig.get();

  protected readonly _modificationUserBoards = this._boardService.modificationUserBoardsSig.get();
  protected readonly _modificationBoard = this._boardService.modificationBoardSig.get();
  protected readonly _modificationBoardTasks = this._boardService.modificationBoardTasksSig.get();
  protected readonly _modificationBoardStatuses = this._boardService.modificationBoardStatusesSig.get();

  protected readonly _boardStatusesPopMenuItems = computed(() => {

    const board = this._board();
    const boardStatuses = this._boardStatuses();
    const boardTask = this._boardTask();
    const boardTaskSubtasks = this._boardTaskSubtasks();

    if (!board || !boardStatuses || !boardTask || !boardTaskSubtasks) {
      return [];
    }

    return board.boardStatusesIds.map((boardStatusId) => boardStatuses.get(boardStatusId)).filter((status) => !!status).map((status) => {
      return {
        value: status!.id,
        label: status!.name
      } as PopMenuItem;
    });
  });

  protected readonly _boardStatusId = computed(() => {

    const board = this._board();
    const boardStatuses = this._boardStatuses();
    const boardTask = this._boardTask();
    const boardStatusesPopMenuItems = this._boardStatusesPopMenuItems();

    if (!board || !boardStatuses || !boardTask || !boardStatusesPopMenuItems) {
      return '';
    }

    if (!boardStatusesPopMenuItems.find((boardStatusesPopMenuItem) => boardTask.boardStatusId === boardStatusesPopMenuItem.value)) {
      return boardStatusesPopMenuItems[0]?.value || '';
    }

    return boardTask.boardStatusId;
  });

  protected readonly _boardTaskView = computed(() => {

    const boardTask = this._boardTask();
    const boardTaskSubtasks = this._boardTaskSubtasks();
    const loadingBoardTaskSubtasks = this._loadingBoardTaskSubtasks();

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
  });

  private readonly _viewIsReadyToShowSig = new Sig(1);
  protected readonly _viewIsReadyToShow = this._viewIsReadyToShowSig.get();

  protected _newWindowWithTaskRequested = false;

  constructor(
    private readonly _boardService: BoardService,
    private readonly _dialogRef: DialogRef<ViewBoardTaskComponent>,
    private readonly _dialog: Dialog,
    private readonly _snackBarService: SnackBarService
  ) {

    effect(() => {

      const boardTaskId = this._boardTaskId();

      const board = this._board();
      const boardStatuses = this._boardStatuses();

      const loadingUserBoards = this._loadingUserBoards();
      const loadingBoard = this._loadingBoard();
      const loadingBoardTask = this._loadingBoardTasks();
      const loadingBoardStatuses = this._loadingBoardStatuses();

      const modificationUserBoards = this._modificationUserBoards();
      const modificationBoard = this._modificationBoard();
      const modificationBoardTask = this._modificationBoardTasks();
      const modificationBoardStatuses = this._modificationBoardStatuses();

      if (
        boardTaskId === undefined ||
        loadingUserBoards ||
        loadingBoard ||
        loadingBoardTask ||
        loadingBoardStatuses ||
        (modificationUserBoards && modificationUserBoards > 0) ||
        (modificationBoard && modificationBoard > 0) ||
        (modificationBoardTask && modificationBoardTask > 0) ||
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

      const boardTask = this._boardTask();

      if (!boardTask && boardTask !== undefined) {
        this._snackBarService.open(`This board task want's found`, 3000);
        this.close();
        return;
      }

      this._viewIsReadyToShowSig.update((val) => (val || 1) - 1);
    });
  }

  updateBoardTaskSubtaskIsCompleted($event: MouseEvent, boardTaskSubtaskId: string, isCompleted: boolean) {

    $event.preventDefault();
    $event.stopPropagation();

    const board = this._board();
    const boardTask = this._boardTask();

    if (!board || !boardTask) {
      return
    }

    this._boardService.updateBoardTaskSubtaskIsCompleted(isCompleted, board.id, boardTask.id, boardTaskSubtaskId).subscribe();
  }

  onBoardTaskStatusIdChange(newBoardStatusId: string) {

    if (this._isRequesting()) {
      return;
    }

    const board = this._board();
    const boardTask = this._boardTask();
    const boardTaskSubtasks = this._boardTaskSubtasks();

    if (!board || !boardTask || !boardTaskSubtasks) {
      return;
    }

    const currentBoardStatusId = this._boardStatusId();

    if (this._boardStatusId() === newBoardStatusId) {
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

    this._isRequesting.set(true);

    this._boardService.boardTaskUpdate(updateTaskData).pipe(
      catchError(() => NEVER)
    ).subscribe(() => {

      try {
        this._isRequesting.set(false);
      } catch {
        /* empty */
      }
    });
  }

  openBoardTaskEditDialog($event: KeyboardEvent | MouseEvent) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    const boardTask = this._boardTask();

    if (boardTask) {
      this._newWindowWithTaskRequested = true;
      this._boardService.boardTaskIdSig.set(boardTask.id);
      this._dialog.open(EditBoardTaskComponent);

      this.close();
    }
  }

  openBoardTaskDeleteDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    const boardTask = this._boardTask();

    if (boardTask) {
      this._newWindowWithTaskRequested = true;
      this._boardService.boardTaskIdSig.set(boardTask.id);
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

    this._showMenuOptions.set(showMenuOptions);
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
      this._boardService.boardTaskIdSig.set(undefined);
    }
  }
}
