import {Dialog, DialogRef} from '@angular/cdk/dialog';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {Component, effect, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardTaskUpdateData} from '../../../models/board-task';
import {BoardService} from '../../../services/board/board.service';
import {SnackBarService} from '../../../services/snack-bar.service';
import {handleTabIndex} from '../../../utils/handle-tabindex';
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
    CdkOverlayOrigin
  ],
  templateUrl: './view-board-task.component.html',
  styleUrl: './view-board-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-view-board-task'
  }
})
export class ViewBoardTaskComponent {

  protected isRequesting = signal(false);
  protected board = toSignal(this._boardService.board$);
  protected boardStatuses = toSignal(this._boardService.boardStatuses$);
  protected boardStatusesPopMenuItems = signal<PopMenuItem[]>([]);
  protected boardStatusId = signal('');
  protected showMenuOptions = signal(false);
  protected abstractBoardService = toSignal(this._boardService.abstractBoardService$);
  protected boardTask = toSignal(this._boardService.boardTask$);
  protected boardTaskSubtasks = toSignal(this._boardService.boardTaskSubtasks$);

  constructor(
    private readonly _boardService: BoardService,
    private readonly _dialogRef: DialogRef<ViewBoardTaskComponent>,
    private readonly _dialog: Dialog,
    private readonly _snackBarService: SnackBarService
  ) {

    effect(() => {

      const board = this.board();
      const boardStatuses = this.boardStatuses();

      if (
        (!board && board !== undefined) ||
        (!boardStatuses && boardStatuses !== undefined)
      ) {
        this._snackBarService.open(`This board want's found`, 3000);
        this.close();
        return;
      }

      if (board === undefined || boardStatuses === undefined) {
        return;
      }

      const boardTask = this.boardTask();

      if (!boardTask && boardTask !== undefined) {
        this._snackBarService.open(`This board task want's found`, 3000);
        this.close();
        return;
      }

      if (boardTask === undefined) {
        return;
      }

      const boardTaskSubtasks = this.boardTaskSubtasks();

      if (!boardTaskSubtasks) {
        return;
      }

      const boardStatusesPopMenuItems = board.boardStatusesIds.map((boardStatusId) => boardStatuses[boardStatusId]).filter((status) => !!status).map((status) => {
        return {
          value: status.id,
          label: status.name
        } as PopMenuItem;
      });

      this.boardStatusesPopMenuItems.set(boardStatusesPopMenuItems);

      if (!boardStatusesPopMenuItems.find((boardStatusesPopMenuItem) => boardTask.boardStatusId === boardStatusesPopMenuItem.value)) {
        this.boardStatusId.set(boardStatusesPopMenuItems[0].value);
      } else {
        this.boardStatusId.set(boardTask.boardStatusId);
      }
    }, {allowSignalWrites: true});
  }

  updateBoardTaskSubtaskIsCompleted($event: MouseEvent, boardTaskSubtaskId: string, isCompleted: boolean) {

    $event.preventDefault();
    $event.stopPropagation();

    const board = this.board();
    const boardTask = this.boardTask();

    if (!board || !boardTask) {
      return
    }

    const abstractBoardService = this.abstractBoardService();

    if (abstractBoardService) {
      abstractBoardService.updateBoardTaskSubtaskIsCompleted(isCompleted, board.id, boardTask.id, boardTaskSubtaskId).subscribe();
    }
  }

  onBoardTaskStatusIdChange(newBoardStatusId: string) {

    const board = this.board();
    const boardTask = this.boardTask();
    const boardTaskSubtasks = this.boardTaskSubtasks();

    if (!board || !boardTask || !boardTaskSubtasks) {
      return;
    }

    const currentBoardStatusId = this.boardStatusId();

    if (this.boardStatusId() === newBoardStatusId) {
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
      boardTaskSubtasks: boardTask.boardTaskSubtasksIds.map((boardTaskSubtaskId) => boardTaskSubtasks[boardTaskSubtaskId]).filter((boardTaskSubtask) => !!boardTaskSubtask).map((boardTaskSubtask) => ({
        id: boardTaskSubtask.id,
        title: boardTaskSubtask.title
      }))
    };

    const abstractBoardService = this.abstractBoardService();

    if (abstractBoardService) {

      this.isRequesting.set(true);

      abstractBoardService.boardTaskUpdate(updateTaskData).pipe(
        catchError(() => {

          try {
            this.isRequesting.set(false);
          } catch {
            /* empty */
          }

          return NEVER;
        })
      ).subscribe(() => {

        try {
          this.isRequesting.set(false);
          this.boardStatusId.set(newBoardStatusId);
        } catch {
          /* empty */
        }
      });
    }
  }

  openBoardTaskEditDialog($event: KeyboardEvent | MouseEvent) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    const boardTask = this.boardTask();

    if (boardTask) {
      this._boardService.boardTaskId = boardTask.id;
      this._dialog.open(EditBoardTaskComponent);

      this.close();
    }
  }

  openBoardTaskDeleteDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    const boardTask = this.boardTask();

    if (boardTask) {
      this._boardService.boardTaskId = boardTask.id;
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

    this.showMenuOptions.set(showMenuOptions);
  }

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }
}
