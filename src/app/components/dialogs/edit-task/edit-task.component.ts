import {DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {Component, computed, effect, Inject, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Firestore, limit} from '@angular/fire/firestore';
import {FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, map, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardTaskUpdateData} from '../../../models/board-task';
import {BoardTaskSubtask} from '../../../models/board-task-subtask';
import {BoardsService} from '../../../services/boards/boards.service';
import {collectionData} from '../../../services/firebase/firestore';
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

  protected board = toSignal(this._boardsService.board$);
  protected boardTasks = toSignal(this._boardsService.boardTasks$);
  protected boardStatuses = toSignal(this._boardsService.boardStatuses$);
  protected boardStatusesPopMenuItems = signal<PopMenuItem[]>([]);
  protected boardId = '';
  protected boardTaskId = '';
  protected boardStatusId = '';
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

  protected form = new FormGroup({
    id: new FormControl<string | null>(null, Validators.required),
    boardId: new FormControl<string | null>(null, Validators.required),
    boardStatusId: new FormControl<string | null>(null, Validators.required),
    title: new FormControl<string | null>(null, Validators.required),
    description: new FormControl<string | null>(''),
    boardTaskSubtasks: new FormArray<FormGroup<{id: FormControl<string | null>, title: FormControl<string | null>}>>([])
  });

  constructor(
    @Inject(DIALOG_DATA) readonly data: {
      boardId: string,
      boardTaskId: string
    },
    private readonly _boardsService: BoardsService,
    private readonly _dialogRef: DialogRef<EditTaskComponent>,
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

      this.boardStatusId = boardTask.boardStatusId;

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

        boardTask.boardTaskSubtasksIds.map((boardTaskSubtaskId) => boardTaskSubtasks[boardTaskSubtaskId]).filter((boardTaskSubtask) => !!boardTaskSubtask).forEach((boardTaskSubtask) => {
          this.addNewBoardTaskSubtask(boardTaskSubtask.id, boardTaskSubtask.title);
        });
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

  updateTask() {

    this.form.updateValueAndValidity();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.form.disable();

    const formValue = this.form.value;

    const boardTaskUpdateData = {
      id: formValue.id,
      boardId: formValue.boardId,
      boardStatus: {
        id: this.boardStatusId,
        newId: formValue.boardStatusId
      },
      title: formValue.title,
      description: formValue.description,
      boardTaskSubtasks: formValue.boardTaskSubtasks?.map((boardTaskSubtask) => {

        if (!boardTaskSubtask.id) {
          delete boardTaskSubtask.id;
        }

        return boardTaskSubtask
      })
    } as BoardTaskUpdateData;

    this.form.disable();

    this.abstractBoardsService()!.boardTaskUpdate(boardTaskUpdateData).pipe(
      catchError(() => {
        this.form.enable();
        return NEVER;
      })
    ).subscribe(() => {
      this._snackBarService.open('Task has been updated', 3000);
      this.close();
    });
  }

  close() {
    this._dialogRef.close();
  }
}
