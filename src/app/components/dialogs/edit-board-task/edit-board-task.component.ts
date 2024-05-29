import {DialogRef} from '@angular/cdk/dialog';
import {Component, computed, effect, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardTaskUpdateData} from '../../../models/board-task';
import {BoardService} from '../../../services/board/board.service';
import {SnackBarService} from '../../../services/snack-bar.service';
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
  selector: 'app-edit-board-task',
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
  templateUrl: './edit-board-task.component.html',
  styleUrl: './edit-board-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-edit-board-task'
  }
})
export class EditBoardTaskComponent {

  protected board = toSignal(this._boardService.board$);
  protected boardStatuses = toSignal(this._boardService.boardStatuses$);
  protected abstractBoardService = toSignal(this._boardService.abstractBoardService$);
  protected boardTask = toSignal(this._boardService.boardTask$);
  protected boardTaskSubtasks = toSignal(this._boardService.boardTaskSubtasks$);

  protected boardStatusId = computed(() => {

    const board = this.board();
    const boardStatuses = this.boardStatuses();

    if (
      (!board && board !== undefined) ||
      (!boardStatuses && boardStatuses !== undefined)
    ) {
      return null;
    }

    if (board === undefined || boardStatuses === undefined) {
      return null;
    }

    const boardTask = this.boardTask();

    if (!boardTask && boardTask !== undefined) {
      return null;
    }

    if (boardTask === undefined) {
      return null;
    }

    return boardTask.boardStatusId;
  });

  protected boardStatusesPopMenuItems = computed<PopMenuItem[]>(() => {

    const board = this.board();
    const boardStatuses = this.boardStatuses();

    if (
      (!board && board !== undefined) ||
      (!boardStatuses && boardStatuses !== undefined)
    ) {
      return [];
    }

    if (board === undefined || boardStatuses === undefined) {
      return [];
    }

    const boardTask = this.boardTask();

    if (!boardTask && boardTask !== undefined) {
      return [];
    }

    if (boardTask === undefined) {
      return [];
    }

    const boardTaskSubtasks = this.boardTaskSubtasks();

    if (!boardTaskSubtasks) {
      return [];
    }

    return board.boardStatusesIds.map((boardStatusId) => boardStatuses.get(boardStatusId)).filter((status) => !!status).map((status) => {
      return {
        value: status!.id,
        label: status!.name
      } as PopMenuItem;
    });

  });

  protected form = new FormGroup({
    id: new FormControl<string | null>(null, Validators.required),
    boardId: new FormControl<string | null>(null, Validators.required),
    boardStatusId: new FormControl<string | null>(null, Validators.required),
    title: new FormControl<string | null>(null, Validators.required),
    description: new FormControl<string | null>(''),
    boardTaskSubtasks: new FormArray<FormGroup<{id: FormControl<string | null>, title: FormControl<string | null>}>>([])
  });

  constructor(
    private readonly _boardService: BoardService,
    private readonly _dialogRef: DialogRef<EditBoardTaskComponent>,
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

      this.form.controls.id.setValue(boardTask.id);
      this.form.controls.boardId.setValue(board.id);

      if (!this.form.controls.title.dirty) {
        this.form.controls.title.setValue(boardTask.title);
      }

      if (!this.form.controls.description.dirty) {
        this.form.controls.description.setValue(boardTask.description);
      }

      if (!this.form.controls.boardTaskSubtasks.dirty) {

        this.form.controls.boardTaskSubtasks.clear();

        boardTask.boardTaskSubtasksIds.map((boardTaskSubtaskId) => boardTaskSubtasks.get(boardTaskSubtaskId)).filter((boardTaskSubtask) => !!boardTaskSubtask).forEach((boardTaskSubtask) => {
          this.addNewBoardTaskSubtask(boardTaskSubtask!.id, boardTaskSubtask!.title);
        });
      }
    });

    effect(() => {

      const boardStatusesPopMenuItems = this.boardStatusesPopMenuItems();

      if (boardStatusesPopMenuItems.length === 0) {
        return;
      }

      if (!this.form.controls.boardStatusId.dirty) {
        setTimeout(() => {
          this.form.controls.boardStatusId.setValue(boardStatusesPopMenuItems[0].value);
        });
      } else {
        if (!boardStatusesPopMenuItems.find((boardStatusesPopMenuItem) => this.form.controls.boardStatusId.value === boardStatusesPopMenuItem.value)) {
          setTimeout(() => {
            this.form.controls.boardStatusId.setValue(boardStatusesPopMenuItems[0].value);
          });
        }
      }
    });
  }

  addNewBoardTaskSubtask(id: null | string = null, title = '') {
    this.form.controls.boardTaskSubtasks.push(
      new FormGroup({
        id: new FormControl(id),
        title: new FormControl(title, [Validators.required])
      })
    );
  }

  boardTaskUpdate() {

    this.form.updateValueAndValidity();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const abstractBoardService = this.abstractBoardService();

    if (abstractBoardService) {

      this.form.disable();

      const formValue = this.form.value;

      const boardTaskUpdateData = {
        id: formValue.id,
        boardId: formValue.boardId,
        boardStatus: {
          id: this.boardStatusId(),
          newId: formValue.boardStatusId
        },
        title: formValue.title,
        description: formValue.description,
        boardTaskSubtasks: formValue.boardTaskSubtasks!.map((boardTaskSubtask) => {

          if (!boardTaskSubtask.id) {
            delete boardTaskSubtask.id;
          }

          return boardTaskSubtask
        })
      } as BoardTaskUpdateData;

      if (boardTaskUpdateData.boardStatus.id === boardTaskUpdateData.boardStatus.newId) {
        delete boardTaskUpdateData.boardStatus.newId;
      }

      abstractBoardService.boardTaskUpdate(boardTaskUpdateData).pipe(
        catchError(() => {

          try {
            this.form.enable();
          } catch {
            /* empty */
          }

          return NEVER;
        })
      ).subscribe(() => {
        this._snackBarService.open('Task has been updated', 3000);
        this.close();
      });
    }
  }

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }
}
