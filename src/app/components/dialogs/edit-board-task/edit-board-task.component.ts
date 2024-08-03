import {DialogRef} from '@angular/cdk/dialog';
import {Component, computed, effect, OnDestroy, signal, ViewEncapsulation} from '@angular/core';
import {FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER, of} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardTaskUpdateData} from '../../../models/board-task';
import {BoardService} from '../../../services/board.service';
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
export class EditBoardTaskComponent implements OnDestroy {

  protected readonly _isRequesting = signal(false);
  protected readonly _board = this._boardService.boardSig.get();
  protected readonly _boardStatuses = this._boardService.boardStatusesSig.get();
  protected readonly _boardTask = this._boardService.boardTaskSig.get();
  protected readonly _boardTaskSubtasks = this._boardService.boardTaskSubtasksSig.get();

  protected readonly _boardStatusId = computed(() => {

    const board = this._board();
    const boardStatuses = this._boardStatuses();

    if (
      (!board && board !== undefined) ||
      (!boardStatuses && boardStatuses !== undefined)
    ) {
      return null;
    }

    if (board === undefined || boardStatuses === undefined) {
      return null;
    }

    const boardTask = this._boardTask();

    if (!boardTask && boardTask !== undefined) {
      return null;
    }

    if (boardTask === undefined) {
      return null;
    }

    return boardTask.boardStatusId;
  });

  protected readonly boardStatusesPopMenuItems = computed<PopMenuItem[]>(() => {

    const board = this._board();
    const boardStatuses = this._boardStatuses();

    if (
      (!board && board !== undefined) ||
      (!boardStatuses && boardStatuses !== undefined)
    ) {
      return [];
    }

    if (board === undefined || boardStatuses === undefined) {
      return [];
    }

    const boardTask = this._boardTask();

    if (!boardTask && boardTask !== undefined) {
      return [];
    }

    if (boardTask === undefined) {
      return [];
    }

    const boardTaskSubtasks = this._boardTaskSubtasks();

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

  protected readonly _form = new FormGroup({
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

      const board = this._board();
      const boardStatuses = this._boardStatuses();

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

      const boardTask = this._boardTask();

      if (!boardTask && boardTask !== undefined) {
        this._snackBarService.open(`This board task want's found`, 3000);
        this.close();
        return;
      }

      if (boardTask === undefined) {
        return;
      }

      const boardTaskSubtasks = this._boardTaskSubtasks();

      if (!boardTaskSubtasks) {
        return;
      }

      this._form.controls.id.setValue(boardTask.id);
      this._form.controls.boardId.setValue(board.id);

      if (!this._form.controls.title.dirty) {
        this._form.controls.title.setValue(boardTask.title);
      }

      if (!this._form.controls.description.dirty) {
        this._form.controls.description.setValue(boardTask.description);
      }

      if (!this._form.controls.boardTaskSubtasks.dirty) {

        this._form.controls.boardTaskSubtasks.clear();

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

      if (!this._form.controls.boardStatusId.dirty) {
        setTimeout(() => {
          this._form.controls.boardStatusId.setValue(boardStatusesPopMenuItems[0].value);
        });
      } else {
        if (!boardStatusesPopMenuItems.find((boardStatusesPopMenuItem) => this._form.controls.boardStatusId.value === boardStatusesPopMenuItem.value)) {
          setTimeout(() => {
            this._form.controls.boardStatusId.setValue(boardStatusesPopMenuItems[0].value);
          });
        }
      }
    });

    effect(() => {

      if (this._isRequesting()) {
        this._form.disable();
      } else {
        this._form.enable();
      }
    });
  }

  boardTaskUpdate() {

    if (this._isRequesting()) {
      return;
    }

    this._form.updateValueAndValidity();
    this._form.markAllAsTouched();

    if (this._form.invalid) {
      return;
    }

    const formValue = this._form.value;

    const boardTaskUpdateData = {
      id: formValue.id,
      boardId: formValue.boardId,
      boardStatus: {
        id: this._boardStatusId(),
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

    this._isRequesting.set(true);

    this._boardService.boardTaskUpdate(boardTaskUpdateData).pipe(
      catchError(() => {

        this._isRequesting.set(false);
        return of(null);
      })
    ).subscribe((result) => {

      if (result) {
        this.close();
      }
    });
  }

  addNewBoardTaskSubtask(id: null | string = null, title = '') {
    this._form.controls.boardTaskSubtasks.push(
      new FormGroup({
        id: new FormControl(id, Validators.required),
        title: new FormControl(title, Validators.required)
      })
    );
  }

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }

  ngOnDestroy(): void {
    this._boardService.boardTaskIdSig.set(undefined);
  }
}
