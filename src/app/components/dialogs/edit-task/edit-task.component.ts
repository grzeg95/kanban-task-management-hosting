import {DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {Component, Inject, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import cloneDeep from 'lodash/cloneDeep';
import {BehaviorSubject, catchError, combineLatest, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {UpdateTaskData} from '../../../models/task';
import {BoardsService} from '../../../services/boards/boards.service';
import {SnackBarService} from '../../../services/snack-bar.service';
import {getProtectedRxjsPipe} from '../../../utils/get-protected.rxjs-pipe';
import {ButtonComponent} from '../../button/button.component';
import {CheckboxComponent} from '../../form/checkbox/checkbox.component';
import {ErrorComponent} from '../../form/error/error.component';
import {FormFieldComponent} from '../../form/form-field/form-field.component';
import {InputComponent} from '../../form/input/input.component';
import {LabelComponent} from '../../form/label/label.component';
import {SelectComponent} from '../../form/select/select.component';
import {TextareaComponent} from '../../form/textarea/textarea.component';
import {LoaderComponent} from '../../loader/loader.component';
import {PopMenuItem} from '../../pop-menu/pop-menu-item/pop-menu-item.model';

@Component({
  selector: 'app-edit-task',
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
    LoaderComponent
  ],
  templateUrl: './edit-task.component.html',
  styleUrl: './edit-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-edit-task'
  }
})
export class EditTaskComponent {

  protected wasUpdated = false;
  protected board$ = this._boardsService.board$;
  protected statuses: PopMenuItem[] = [];
  protected statusId$ = new BehaviorSubject('');
  protected taskId = '';
  protected abstractBoardsService = toSignal(this._boardsService.abstractBoardsService$);

  protected form = new FormGroup({
    id: new FormControl<string | null>(null, Validators.required),
    boardId: new FormControl<string | null>(null, Validators.required),
    boardStatusId: new FormControl<string | null>(null, Validators.required),
    title: new FormControl<string | null>(null, Validators.required),
    description: new FormControl<string | null>(''),
    subtasks: new FormArray<FormGroup<{id: FormControl<string | null>, title: FormControl<string | null>}>>([])
  });

  constructor(
    @Inject(DIALOG_DATA) readonly data: {
      statusId: string,
      taskId: string
    },
    private readonly _boardsService: BoardsService,
    private readonly _dialogRef: DialogRef<EditTaskComponent>,
    private readonly _snackBarService: SnackBarService
  ) {

    this.statusId$.next(data.statusId);
    this.taskId = data.taskId;

    combineLatest([
      this.board$,
      this.statusId$.pipe(getProtectedRxjsPipe())
    ]).pipe(
      takeUntilDestroyed()
    ).subscribe(([board, statusId]) => {

      if (this.wasUpdated) {
        this.wasUpdated = false;
        return;
      }

      if (!board && board !== undefined) {
        this.close();
        return;
      }

      if (board === undefined) {
        return;
      }

      const task = cloneDeep(board.statuses[statusId].tasks[this.taskId]);

      if (!task) {
        this.close();
        return;
      }

      this.statuses = board.statusesIdsSequence.map((statusId) => board.statuses[statusId]).map((status) => {
        return {
          value: status.id,
          label: status.name
        } as PopMenuItem;
      });

      this.form.controls.id.setValue(task.id);
      this.form.controls.boardId.setValue(board.id);

      if (!this.form.controls.title.dirty) {
        this.form.controls.title.setValue(task.title);
      }

      if (!this.form.controls.description.dirty) {
        this.form.controls.description.setValue(task.description);
      }

      if (!this.form.controls.subtasks.dirty) {
        this.form.controls.subtasks.clear();

        task.subtasksIdsSequence.forEach((subtaskId) => {
          this.addNewSubtask(subtaskId, task.subtasks[subtaskId].title);
        });
      }

      setTimeout(() => {
        this.form.controls.boardStatusId.setValue(statusId);
      });
    });
  }

  addNewSubtask(id: null | string = null, title = '') {
    this.form.controls.subtasks.push(
      new FormGroup({
        id: new FormControl(id),
        title: new FormControl(title, [Validators.required])
      })
    );
  }

  updateTask() {

    this.form.updateValueAndValidity();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.form.disable();

    const updateTaskData: UpdateTaskData = {
      id: this.form.value.id!,
      boardId: this.form.value.boardId!,
      description: this.form.value.description!,
      title: this.form.value.title!,
      status: {
        id: this.statusId$.value,
        newId: this.form.value.boardStatusId!
      },
      subtasks: (this.form.value.subtasks || []).map((subtask) => {

        const editedSubtask = {
          id: subtask.id!,
          title: subtask.title!
        } as {
          id?: string;
          title: string;
        };

        if (editedSubtask.id === null) {
          delete editedSubtask.id;
        }

        return editedSubtask;
      })
    };

    let nextBoardStatusId = updateTaskData.status.newId!

    if (updateTaskData.status.id === updateTaskData.status.newId) {
      delete updateTaskData.status.newId;
      nextBoardStatusId = updateTaskData.status.id!;
    }

    this.form.disable();

    this.wasUpdated = true;
    this.abstractBoardsService()!.updateTask(updateTaskData).pipe(
      catchError(() => {
        this.form.enable();
        return NEVER;
      })
    ).subscribe(() => {
      this.statusId$.next(nextBoardStatusId);
      this._snackBarService.open('Task has been updated', 3000);
      this.close();
    });
  }

  close() {
    this._dialogRef.close();
  }
}
