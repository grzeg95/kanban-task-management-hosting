import {DialogRef} from '@angular/cdk/dialog';
import {AsyncPipe} from '@angular/common';
import {Component, DestroyRef, inject, OnInit, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {BehaviorSubject, catchError, combineLatest, of} from 'rxjs';
import {fadeZoomInOutTrigger} from "../../../animations/fade-zoom-in-out.trigger";
import {BoardUpdateData} from '../../../models/board';
import {BoardService} from '../../../services/board.service';
import {SnackBarService} from '../../../services/snack-bar.service';
import {ButtonComponent} from '../../button/button.component';
import {ErrorComponent} from '../../form/error/error.component';
import {FormFieldComponent} from '../../form/form-field/form-field.component';
import {InputComponent} from '../../form/input/input.component';
import {LabelComponent} from '../../form/label/label.component';
import {LoaderComponent} from '../../loader/loader.component';

@Component({
  selector: 'app-edit-board',
  imports: [
    InputComponent,
    ButtonComponent,
    ReactiveFormsModule,
    FormFieldComponent,
    LabelComponent,
    ErrorComponent,
    LoaderComponent,
    AsyncPipe
  ],
  templateUrl: './edit-board.component.html',
  styleUrl: './edit-board.component.scss',
  encapsulation: ViewEncapsulation.None,
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class EditBoardComponent implements OnInit {

  private readonly _boardService = inject(BoardService);
  private readonly _dialogRef = inject(DialogRef<EditBoardComponent>);
  private readonly _snackBarService = inject(SnackBarService);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly _isRequesting$ = new BehaviorSubject(false);
  protected readonly _board$ = this._boardService.board$;
  protected readonly _boardStatuses$ = this._boardService.boardStatuses$;

  private _initialBoardName = '';
  private readonly _initialBoardStatuses = new Map<string, string>();

  protected readonly _viewIsReadyToShow$ = new BehaviorSubject(1);

  protected readonly _form = new FormGroup({
    boardId: new FormControl('', Validators.required),
    boardName: new FormControl('', Validators.required),
    boardStatuses: new FormArray<FormGroup<{id: FormControl<string | null>, name: FormControl<string | null>}>>([])
  });

  ngOnInit() {

    combineLatest([
      this._board$,
      this._boardStatuses$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe(([
      board,
      boardStatuses
    ]) => {

      if (
        (!board && board !== undefined) ||
        (!boardStatuses && boardStatuses !== undefined)
      ) {
        this._snackBarService.open(`This board want's found`, 3000);
        this.close();
        return;
      }

      if (!board || !boardStatuses) {
        return;
      }

      this._form.controls.boardId.setValue(board.id);

      if (!this._form.controls.boardName.dirty) {
        this._form.controls.boardName.setValue(board.name);
        this._initialBoardName = board.name;
      }

      if (!this._form.controls.boardStatuses.dirty) {
        this._form.controls.boardStatuses.reset();

        board.boardStatusesIds.map((boardStatusId) => boardStatuses.get(boardStatusId)).filter((boardStatus) => !!boardStatus).forEach((boardStatus) => {
          this.addNewStatusName(boardStatus!.id, boardStatus!.name);
          this._initialBoardStatuses.set(boardStatus!.id, boardStatus!.name);
        });
      }

      this._viewIsReadyToShow$.next(this._viewIsReadyToShow$.value - 1);
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

  boardUpdate() {

    if (this._isRequesting$.value) {
      return;
    }

    this._form.updateValueAndValidity();
    this._form.markAllAsTouched();

    if (this._form.invalid) {
      return;
    }

    const updateBoardData = {
      id: this._form.value.boardId,
      name: this._form.value.boardName,
      boardStatuses: this._form.value.boardStatuses?.map((boardStatus) => {

        if (!boardStatus.id) {
          delete boardStatus.id;
        }

        return boardStatus;
      }),
    } as BoardUpdateData;

    const boardNameWasChanged = this._initialBoardName !== updateBoardData.name;
    const boardStatusNameWasChanged = updateBoardData.boardStatuses.some((boardStatus) => boardStatus.id && this._initialBoardStatuses.get(boardStatus.id) !== boardStatus.name);
    const boardStatusAddedOrDeleted = this._initialBoardStatuses.size !== updateBoardData.boardStatuses.length;

    this._isRequesting$.next(true);

    this._boardService.boardUpdate(updateBoardData, boardNameWasChanged, boardStatusNameWasChanged, boardStatusAddedOrDeleted).pipe(
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

  addNewStatusName(id: null | string = null, name = '') {
    this._form.controls.boardStatuses.push(
      new FormGroup({
        id: new FormControl(id),
        name: new FormControl(name, [Validators.required])
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
}
