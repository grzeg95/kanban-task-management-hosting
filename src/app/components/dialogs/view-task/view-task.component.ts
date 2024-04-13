import {Dialog, DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {Component, computed, effect, Inject, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Firestore, limit} from '@angular/fire/firestore';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import cloneDeep from 'lodash/cloneDeep';
import {catchError, map, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardTask, BoardTaskUpdateData} from '../../../models/board-task';
import {BoardTaskSubtask} from '../../../models/board-task-subtask';
import {BoardsService} from '../../../services/boards/boards.service';
import {InMemoryBoardsService} from '../../../services/boards/in-memory-boards.service';
import {collectionData} from '../../../services/firebase/firestore';
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
import {DeleteTaskComponent} from '../delete-task/delete-task.component';
import {EditTaskComponent} from '../edit-task/edit-task.component';

@Component({
  selector: 'app-view-task',
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
  templateUrl: './view-task.component.html',
  styleUrl: './view-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-view-task'
  }
})
export class ViewTaskComponent {

  protected isLoading = signal(false);
  protected board = toSignal(this._boardsService.board$);
  protected boardTasks = toSignal(this._boardsService.boardTasks$);
  protected boardStatuses = toSignal(this._boardsService.boardStatuses$);
  protected boardStatusesPopMenuItems = signal<PopMenuItem[]>([]);
  protected boardId = '';
  protected boardTaskId = '';
  protected boardStatusId = signal('');
  protected showMenuOptions = signal(false);
  protected abstractBoardsService = toSignal(this._boardsService.abstractBoardsService$);
  protected boardTask = computed(() => this.boardTasks()?.[this.boardTaskId]);

  protected boardTaskSubtasks = toSignal(
    collectionData(BoardTaskSubtask.refs(this._firestore, this.boardId, this.boardTaskId), limit(5)).pipe(
      map((boardTaskSubtasks) => {

        const boardTaskSubtasksMap: { [key in string]: BoardTaskSubtask } = {};

        for (const boardTaskSubtask of boardTaskSubtasks) {
          Object.assign(boardTaskSubtasksMap, {[boardTaskSubtask.id]: boardTaskSubtask});
        }

        return boardTaskSubtasksMap;
      })
    )
  );

  constructor(
    @Inject(DIALOG_DATA) readonly data: {
      boardId: string
      boardTaskId: string
    },
    private readonly _boardsService: BoardsService,
    private readonly _dialogRef: DialogRef<ViewTaskComponent>,
    private readonly _dialog: Dialog,
    private readonly _snackBarService: SnackBarService,
    private readonly _firestore: Firestore
  ) {

    this.boardId = data.boardId;
    this.boardTaskId = data.boardTaskId;

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

      this.boardStatusId.set(boardTask.boardStatusId);

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
      }
    });
  }

  updateBoardTaskSubtaskIsCompleted($event: MouseEvent, boardTaskSubtaskId: string, checked: boolean) {

    $event.preventDefault();
    $event.stopPropagation();

    (this.abstractBoardsService() as InMemoryBoardsService).updateBoardTaskSubtaskIsCompleted(checked, this.boardId, this.boardTaskId, boardTaskSubtaskId).subscribe();
  }

  onBoardTaskStatusChange(newBoardStatusId: string) {

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

    this.isLoading.set(true);
    this.abstractBoardsService()!.boardTaskUpdate(updateTaskData).pipe(
      catchError(() => {
        this.isLoading.set(false);
        return NEVER;
      })
    ).subscribe(() => {
      this.isLoading.set(false);
      this.boardStatusId.set(newBoardStatusId);
    });
  }

  openBoardTaskEditDialog($event: KeyboardEvent | MouseEvent) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditTaskComponent, {
      data: {
        _boardsService: this._boardsService,
        boardId: this.boardId,
        boardTaskId: this.boardTaskId
      }
    });

    this.close();
  }

  openBoardTaskDeleteDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(DeleteTaskComponent, {
      data: {
        _boardsService: this._boardsService,
        boardTaskId: this.boardTaskId
      }
    });

    this.close();
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
    this._dialogRef.close();
  }
}
