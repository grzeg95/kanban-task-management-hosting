import {Dialog, DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {Component, effect, Inject, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import cloneDeep from 'lodash/cloneDeep';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {Task, UpdateTaskData} from '../../../models/task';
import {AuthService} from '../../../services/auth/auth.service';
import {BoardsService} from '../../../services/boards/boards.service';
import {FirebaseBoardsService} from '../../../services/boards/firebase-boards.service';
import {InMemoryBoardsService} from '../../../services/boards/in-memory-boards.service';
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
  protected task: Task | undefined;
  protected statuses: PopMenuItem[] = [];
  protected statusId = signal('');
  protected taskId = '';
  protected showMenuOptions = signal(false);
  protected abstractBoardsService = toSignal(this._boardsService.abstractBoardsService$);
  protected storeType = toSignal(this._boardsService.storeType$);
  protected wasUpdated = false;

  constructor(
    @Inject(DIALOG_DATA) readonly data: {
      statusId: string,
      taskId: string
    },
    private readonly _boardsService: BoardsService,
    private readonly _dialogRef: DialogRef<ViewTaskComponent>,
    private readonly _dialog: Dialog,
    private readonly _authService: AuthService
  ) {

    this.statusId.set(data.statusId);
    this.taskId = data.taskId;

    effect(() => {

      if (this.wasUpdated) {
        this.wasUpdated = false;
        return;
      }

      const board = this.board();
      const statusId = this.statusId();

      if (!board && board !== undefined) {
        this.close();
        return;
      }

      if (board === undefined) {
        return;
      }

      this.task = cloneDeep(board.statuses[statusId].tasks[this.taskId]);

      if (!this.task) {
        this.close();
        return;
      }

      this.statuses = board.statusesIdsSequence.map((statusId) => board.statuses[statusId]).map((status) => {
        return {
          value: status.id,
          label: status.name
        } as PopMenuItem;
      });
    });
  }

  getCompletedSubtasks(task: Task) {
    return task.subtasksIdsSequence.reduce((cnt, subtaskId) => cnt + (+task.subtasks[subtaskId].isCompleted! || 0), 0) || 0;
  }

  toggleSubtaskCompletion($event: MouseEvent, subtasksId: string, checked: boolean) {

    $event.preventDefault();
    $event.stopPropagation();

    if (this.storeType() === 'firebase') {

      const path = `users/${this._authService.user$.value?.id}/boards/${this.board()?.id}`;

      (this.abstractBoardsService() as FirebaseBoardsService).updateDoc(path, {
        [`statuses.${this.statusId()}.tasks.${this.taskId}.subtasks.${subtasksId}.isCompleted`]: checked
      }).subscribe();
    } else {
      (this.abstractBoardsService() as InMemoryBoardsService).toggleSubtaskCompletion(this.board()!.id, this.statusId(), this.taskId, subtasksId, checked).subscribe();
    }
  }

  onStatusChange(boardStatusId: string) {

    const board = this.board();
    const task = this.task;

    if (!board || !task) {
      return;
    }

    if (this.statusId() === boardStatusId) {
      return;
    }

    const updateTaskData: UpdateTaskData = {
      id: task.id,
      boardId: board.id,
      description: task.description,
      title: task.title,
      status: {
        id: this.statusId(),
        newId: boardStatusId
      },
      subtasks: task.subtasksIdsSequence.map((subtaskId) => ({
        id: task.subtasks[subtaskId].id,
        title: task.subtasks[subtaskId].title
      }))
    };

    this.isLoading.set(true);
    this.wasUpdated = true;
    this.abstractBoardsService()!.updateTask(updateTaskData).pipe(
      catchError(() => {
        this.isLoading.set(false);
        return NEVER;
      })
    ).subscribe(() => {
      this.isLoading.set(false);
      this.statusId.set(boardStatusId);
    });
  }

  openEditTaskDialog($event: KeyboardEvent | MouseEvent) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditTaskComponent, {
      data: {
        _boardsService: this._boardsService,
        statusId: this.statusId(),
        taskId: this.taskId
      }
    });

    this.close();
  }

  openDeleteTaskDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(DeleteTaskComponent, {
      data: {
        _boardsService: this._boardsService,
        statusId: this.statusId(),
        taskId: this.taskId
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
