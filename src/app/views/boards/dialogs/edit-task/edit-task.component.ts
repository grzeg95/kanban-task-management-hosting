import {DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {Component, DestroyRef, Inject, Input, Optional, signal, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import cloneDeep from 'lodash/cloneDeep';
import {BehaviorSubject, catchError, combineLatest, NEVER} from 'rxjs';
import {ButtonComponent} from '../../../../components/button/button.component';
import {CheckboxComponent} from '../../../../components/form/checkbox/checkbox.component';
import {ErrorComponent} from '../../../../components/form/error/error.component';
import {FormFieldComponent} from '../../../../components/form/form-field/form-field.component';
import {InputComponent} from '../../../../components/form/input/input.component';
import {LabelComponent} from '../../../../components/form/label/label.component';
import {SelectComponent} from '../../../../components/form/select/select.component';
import {TextareaComponent} from '../../../../components/form/textarea/textarea.component';
import {PopMenuItem} from '../../../../components/pop-menu/pop-menu-item/pop-menu-item.model';
import {SvgDirective} from '../../../../directives/svg.directive';
import {FunctionsService} from '../../../../services/firebase/functions.service';
import {SnackBarService} from '../../../../services/snack-bar.service';
import {getProtectedRxjsPipe} from '../../../../utils/get-protected.rxjs-pipe';
import {BoardsService} from '../../boards.service';
import {Board} from '../../models/board';
import {Task, UpdateTaskData, UpdateTaskResult} from '../../models/task';

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
    FormsModule
  ],
  templateUrl: './edit-task.component.html',
  styleUrl: './edit-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-edit-task'
  }
})
export class EditTaskComponent {

  wasUpdated = signal(false);

  board = signal<Board | undefined>(undefined);
  task = signal<Task | null | undefined>(undefined);
  statuses = signal<PopMenuItem[]>([]);

  form = new FormGroup({
    id: new FormControl(''),
    boardId: new FormControl(''),
    boardStatusId: new FormControl(''),
    title: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    subtasks: new FormArray<FormGroup<{id: FormControl<string | null>, title: FormControl<string | null>}>>([])
  });

  @Input({required: true}) statusId = '';
  private readonly _statusId$;

  @Input({required: true}) taskId = '';

  constructor(
    @Optional() @Inject(DIALOG_DATA) readonly data: {
      _boardsService: BoardsService,
      statusId: string,
      taskId: string
    },
    @Optional() private readonly _boardsService: BoardsService,
    @Optional() private readonly _dialogRef: DialogRef<EditTaskComponent>,
    private readonly _functionsService: FunctionsService,
    private readonly _destroyRef: DestroyRef,
    private readonly _snackBarService: SnackBarService
  ) {

    if (data) {
      this._boardsService = data._boardsService;
      this.statusId = data.statusId;
      this.taskId = data.taskId;
    }

    this._statusId$ = new BehaviorSubject<string>(this.statusId);
    this._observe();
  }

  private _observe() {

    combineLatest([
      this._boardsService.board$.pipe(getProtectedRxjsPipe()),
      this._statusId$.pipe(getProtectedRxjsPipe())
    ]).pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe(([nextBoard, statusId]) => {

      if (this.wasUpdated()) {
        this.wasUpdated.set(false);
        return;
      }

      if (!nextBoard) {
        this.close();
        return;
      }

      const currentBoard = this.board();

      if (!currentBoard) {
        this.board.set(nextBoard);
      } else if (currentBoard.id !== nextBoard.id) {
        this.close();
        return;
      } else {
        this.board.set(nextBoard);
      }

      const board = this.board()!;

      const status = cloneDeep(board.statuses[statusId]);

      if (!status) {
        this.close();
        return;
      }

      const task = cloneDeep(status.tasks[this.taskId]);

      if (!task) {
        this.close();
        return;
      }

      this.task.set(task);

      const statuses = board.statusesIdsSequence.map((statusId) => board.statuses[statusId]).map((status) => {
        return {
          value: status.id,
          label: status.name
        } as PopMenuItem;
      });

      this.statuses.set(statuses);

      this.form.controls.id.setValue(task.id);
      this.form.controls.boardId.setValue(board.id);
      this.form.controls.title.setValue(task.title);
      this.form.controls.description.setValue(task.description);

      this.form.controls.subtasks.clear();

      task.subtasksIdsSequence.forEach((subtaskId) => {
        this.addNewSubtask(subtaskId, task.subtasks[subtaskId].title);
      });

      this.form.controls.boardStatusId.setValue(statusId);
    });
  }

  close() {
    this.task.set(null);
    this.statuses.set([]);
    this._dialogRef?.close();
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
        id: this._statusId$.value,
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

    this.wasUpdated.set(true);
    this._functionsService.httpsCallable<UpdateTaskData, UpdateTaskResult>('task-update', updateTaskData).pipe(
      catchError(() => {
        this.form.enable();
        return NEVER;
      })
    ).subscribe(() => {
      this._statusId$.next(nextBoardStatusId);
      this._snackBarService.open('Task has been updated', 3000);
      this.close();
    });
  }
}
