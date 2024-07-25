import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, signal, ViewEncapsulation} from '@angular/core';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
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

  protected isDone = signal(false);
  protected isRequesting = signal(false);
  protected board = this._boardService.getBoard();
  protected boardStatusesSig = this._boardService.getBoardStatuses();
  protected initialBoardName = '';
  protected initialBoardStatuses = new Map<string, string>();

  protected form = new FormGroup({
    boardId: new FormControl('', [Validators.required]),
    boardName: new FormControl('', [Validators.required]),
    boardStatuses: new FormArray<FormGroup<{id: FormControl<string | null>, name: FormControl<string | null>}>>([])
  });

  constructor(
    private readonly _boardService: BoardService,
    private readonly _dialogRef: DialogRef<EditBoardComponent>,
    private readonly _snackBarService: SnackBarService
  ) {

    effect(() => {

      const board = this.board();
      const boardStatuses = this.boardStatusesSig();

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

      this.form.controls.boardId.setValue(board.id);

      if (!this.form.controls.boardName.dirty) {
        this.form.controls.boardName.setValue(board.name);
        this.initialBoardName = board.name;
      }

      if (!this.form.controls.boardStatuses.dirty) {
        this.form.controls.boardStatuses.reset();

        board.boardStatusesIds.map((boardStatusId) => boardStatuses.get(boardStatusId)).filter((boardStatus) => !!boardStatus).forEach((boardStatus) => {
          this.addNewStatusName(boardStatus!.id, boardStatus!.name);
          this.initialBoardStatuses.set(boardStatus!.id, boardStatus!.name);
        });
      }
    });

    effect(() => {

      if (this.isDone()) {
        this.close();
      }
    });

    effect(() => {

      if (this.isRequesting()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });

    effect(() => {

      if (!this.isRequesting()) {
        return;
      }

      this.form.updateValueAndValidity();
      this.form.markAllAsTouched();

      if (this.form.invalid) {
        return;
      }

      const updateBoardData = {
        id: this.form.value.boardId,
        name: this.form.value.boardName,
        boardStatuses: this.form.value.boardStatuses?.map((boardStatus) => {

          if (!boardStatus.id) {
            delete boardStatus.id;
          }

          return boardStatus;
        }),
      } as BoardUpdateData;

      const boardNameWasChanged = this.initialBoardName !== updateBoardData.name;
      const boardStatusNameWasChanged = updateBoardData.boardStatuses.some((boardStatus) => boardStatus.id && this.initialBoardStatuses.get(boardStatus.id) !== boardStatus.name);
      const boardStatusAddedOrDeleted = this.initialBoardStatuses.size !== updateBoardData.boardStatuses.length;

      this._boardService.boardUpdate(updateBoardData, boardNameWasChanged, boardStatusNameWasChanged, boardStatusAddedOrDeleted).pipe(
        catchError(() => {
          this.isRequesting.set(false);
          return NEVER;
        })
      ).subscribe(() => {
        this.isDone.set(true);
        this.isRequesting.set(false);
      });
    });
  }

  addNewStatusName(id: null | string = null, name = '') {
    this.form.controls.boardStatuses.push(
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
