import {DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {Component, Inject, Optional, signal, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {ButtonComponent} from '../../../../components/button/button.component';
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
import {CreateTaskData, CreateTaskResult} from '../../models/task';

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
    SelectComponent
  ],
  templateUrl: './add-new-task.component.html',
  styleUrl: './add-new-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-view-task'
  }
})
export class AddNewTaskComponent {

  statuses = signal<PopMenuItem[]>([]);

  form = new FormGroup({
    boardId: new FormControl(''),
    boardStatusId: new FormControl(''),
    title: new FormControl('', [Validators.required]),
    description: new FormControl('', [Validators.required]),
    subtasks: new FormArray<FormControl<string | null>>([])
  });

  constructor(
    @Optional() @Inject(DIALOG_DATA) readonly data: {_boardsService: BoardsService},
    @Optional() private readonly _boardsService: BoardsService,
    @Optional() private readonly _dialogRef: DialogRef<AddNewTaskComponent>,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {

    if (data) {
      this._boardsService = data._boardsService;
    }

    this._boardsService.board$.pipe(
      getProtectedRxjsPipe(),
      takeUntilDestroyed()
    ).subscribe((board) => {

      if (!board) {
        this.close();
        return;
      }

      this.form.controls.boardId.setValue(board.id);

      const statuses = board.statusesIdsSequence.map((statusId) => board.statuses[statusId]).map((status) => {
        return {
          value: status.id,
          label: status.name
        } as PopMenuItem;
      });

      this.statuses.set(statuses);
      this.form.controls.boardStatusId.setValue(statuses[0].value);
    });

    this.addNewSubtask();
  }

  addNewSubtask() {
    this.form.controls.subtasks.push(new FormControl('', [Validators.required]));
  }

  createTask() {

    this.form.updateValueAndValidity();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.form.disable();

    const createTaskData = {
      boardId: this.form.value.boardId,
      boardStatusId: this.form.value.boardStatusId,
      title: this.form.value.title,
      description: this.form.value.description,
      subtasks: this.form.value.subtasks
    } as CreateTaskData;

    this._functionsService.httpsCallable<CreateTaskData, CreateTaskResult>('task-create', createTaskData).pipe(
      catchError(() => {
        this.form.enable();
        return NEVER;
      })
    ).subscribe(() => {
      this._dialogRef.close();
      this._snackBarService.open('Task has been created', 3000);
    });
  }

  close() {
    this._dialogRef?.close();
  }
}
