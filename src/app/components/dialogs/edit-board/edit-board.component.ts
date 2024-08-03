import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, signal, ViewEncapsulation} from '@angular/core';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER, of} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
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
  standalone: true,
  imports: [
    InputComponent,
    ButtonComponent,
    ReactiveFormsModule,
    SvgDirective,
    FormFieldComponent,
    LabelComponent,
    ErrorComponent,
    LoaderComponent
  ],
  templateUrl: './edit-board.component.html',
  styleUrl: './edit-board.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-edit-board'
  }
})
export class EditBoardComponent {

  protected readonly _isRequesting = signal(false);
  protected readonly _board = this._boardService.boardSig.get();
  protected readonly _boardStatusesSig = this._boardService.boardStatusesSig.get();

  private _initialBoardName = '';
  private readonly _initialBoardStatuses = new Map<string, string>();

  protected readonly _form = new FormGroup({
    boardId: new FormControl('', Validators.required),
    boardName: new FormControl('', Validators.required),
    boardStatuses: new FormArray<FormGroup<{id: FormControl<string | null>, name: FormControl<string | null>}>>([])
  });

  constructor(
    private readonly _boardService: BoardService,
    private readonly _dialogRef: DialogRef<EditBoardComponent>,
    private readonly _snackBarService: SnackBarService
  ) {

    effect(() => {

      const board = this._board();
      const boardStatuses = this._boardStatusesSig();

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
    });

    effect(() => {

      if (this._isRequesting()) {
        this._form.disable();
      } else {
        this._form.enable();
      }
    });
  }

  boardUpdate() {

    if (this._isRequesting()) {
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

    this._isRequesting.set(true);

    this._boardService.boardUpdate(updateBoardData, boardNameWasChanged, boardStatusNameWasChanged, boardStatusAddedOrDeleted).pipe(
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
