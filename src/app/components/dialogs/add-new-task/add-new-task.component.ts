import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {CreateTaskData} from '../../../models/task';
import {BoardsService} from '../../../services/boards/boards.service';
import {SnackBarService} from '../../../services/snack-bar.service';
import {ButtonComponent} from '../../button/button.component';
import {ErrorComponent} from '../../form/error/error.component';
import {FormFieldComponent} from '../../form/form-field/form-field.component';
import {InputComponent} from '../../form/input/input.component';
import {LabelComponent} from '../../form/label/label.component';
import {SelectComponent} from '../../form/select/select.component';
import {TextareaComponent} from '../../form/textarea/textarea.component';
import {LoaderComponent} from '../../loader/loader.component';
import {PopMenuItem} from '../../pop-menu/pop-menu-item/pop-menu-item.model';

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
    LoaderComponent
  ],
  templateUrl: './add-new-task.component.html',
  styleUrl: './add-new-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-view-task'
  }
})
export class AddNewTaskComponent {

  protected statuses: PopMenuItem[] = [];
  protected board = toSignal(this._boardsService.board$);
  protected abstractBoardsService = toSignal(this._boardsService.abstractBoardsService$)

  protected form = new FormGroup({
    boardId: new FormControl(''),
    boardStatusId: new FormControl(''),
    title: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    subtasks: new FormArray<FormControl<string | null>>([])
  });

  constructor(
    private readonly _boardsService: BoardsService,
    private readonly _dialogRef: DialogRef<AddNewTaskComponent>,
    private readonly _snackBarService: SnackBarService
  ) {

    effect(() => {

      const board = this.board();

      if (!board && board !== undefined) {
        this.close();
        return;
      }

      if (board === undefined) {
        return;
      }

      this.form.controls.boardId.setValue(board.id);

      this.statuses = board.statusesIdsSequence.map((statusId) => board.statuses[statusId]).map((status) => {
        return {
          value: status.id,
          label: status.name
        } as PopMenuItem;
      });

      setTimeout(() => {
        this.form.controls.boardStatusId.setValue(this.statuses[0].value);
      });
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

    this.abstractBoardsService()!.createTask(createTaskData).pipe(
      catchError(() => {
        this.form.enable();
        return NEVER;
      })
    ).subscribe(() => {
      this.close();
      this._snackBarService.open('Task has been created', 3000);
    });
  }

  close() {
    this._dialogRef.close();
  }
}
