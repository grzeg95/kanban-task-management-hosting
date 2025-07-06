import {DialogRef} from '@angular/cdk/dialog';
import {AsyncPipe} from '@angular/common';
import {Component, DestroyRef, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {BehaviorSubject, catchError, combineLatest, map, of} from 'rxjs';
import {fadeZoomInOutTrigger} from '../../../animations/fade-zoom-in-out.trigger';
import {BoardTaskUpdateData} from '../../../models/board-task';
import {BoardService} from '../../../services/board.service';
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
  selector: 'app-edit-board-task',
  standalone: true,
  imports: [
    InputComponent,
    ButtonComponent,
    ReactiveFormsModule,
    FormFieldComponent,
    LabelComponent,
    ErrorComponent,
    TextareaComponent,
    SelectComponent,
    FormsModule,
    LoaderComponent,
    AsyncPipe
  ],
  templateUrl: './edit-board-task.component.html',
  styleUrl: './edit-board-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class EditBoardTaskComponent implements OnInit, OnDestroy {

  protected readonly _isRequesting$ = new BehaviorSubject(false);
  protected readonly _board$ = this._boardService.board$;
  protected readonly _boardStatuses$ = this._boardService.boardStatuses$;
  protected readonly _boardTask$ = this._boardService.boardTask$;
  protected readonly _boardTaskSubtasks$ = this._boardService.boardTaskSubtasks$;

  protected readonly boardStatusesPopMenuItems$ = combineLatest([
    this._board$,
    this._boardStatuses$,
    this._boardTask$,
    this._boardTaskSubtasks$
  ]).pipe(
    map(([
      board,
      boardStatuses,
      boardTask,
      boardTaskSubtasks
    ]) => {

      if (
        (!board && board !== undefined) ||
        (!boardStatuses && boardStatuses !== undefined)
      ) {
        return [];
      }

      if (board === undefined || boardStatuses === undefined) {
        return [];
      }

      if (!boardTask && boardTask !== undefined) {
        return [];
      }

      if (boardTask === undefined) {
        return [];
      }

      if (!boardTaskSubtasks) {
        return [];
      }

      return board.boardStatusesIds.map((boardStatusId) => boardStatuses.get(boardStatusId)).filter((status) => !!status).map((status) => {
        return {
          value: status!.id,
          label: status!.name
        } as PopMenuItem;
      });
    })
  );

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
    private readonly _snackBarService: SnackBarService,
    private readonly _destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {

    combineLatest([
      this._board$,
      this._boardStatuses$,
      this._boardTask$,
      this._boardTaskSubtasks$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe(([
      board,
      boardStatuses,
      boardTask,
      boardTaskSubtasks
    ]) => {

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

      if (!boardTask && boardTask !== undefined) {
        this._snackBarService.open(`This board task want's found`, 3000);
        this.close();
        return;
      }

      if (boardTask === undefined) {
        return;
      }

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

    combineLatest([
      this.boardStatusesPopMenuItems$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe(([
      boardStatusesPopMenuItems
    ]) => {

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

    combineLatest([
      this._isRequesting$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe(([
      isRequesting
    ]) => {

      if (isRequesting) {
        this._form.disable();
      } else {
        this._form.enable();
      }
    });
  }

  boardTaskUpdate() {

    if (this._isRequesting$.value) {
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
        id: this._boardTask$.value!.boardStatusId,
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

    this._isRequesting$.next(true);

    this._boardService.boardTaskUpdate(boardTaskUpdateData).pipe(
      catchError(() => {

        this._isRequesting$.next(false);
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
    this._boardService.boardTaskId$.next(null);
  }
}
