import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardUpdateData} from '../../../models/board';
import {BoardsService} from '../../../services/boards/boards.service';
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

  protected board = toSignal(this._boardsService.board$);
  protected boardStatuses = toSignal(this._boardsService.boardStatuses$);
  protected abstractBoardsService = toSignal(this._boardsService.abstractBoardsService$);

  protected form = new FormGroup({
    id: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    boardStatuses: new FormArray<FormGroup<{id: FormControl<string | null>, name: FormControl<string | null>}>>([])
  });

  constructor(
    private readonly _boardsService: BoardsService,
    private readonly _dialogRef: DialogRef<EditBoardComponent>,
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

      if (!board || !boardStatuses) {
        return;
      }

      this.form.controls.id.setValue(board.id);

      if (!this.form.controls.name.dirty) {
        this.form.controls.name.setValue(board.name);
      }

      if (!this.form.controls.boardStatuses.dirty) {
        this.form.controls.boardStatuses.reset();

        board.boardStatusesIds.map((boardStatusId) => boardStatuses[boardStatusId]).filter((boardStatus) => !!boardStatus).forEach((boardStatus) => {
          this.addNewStatusName(boardStatus.id, boardStatus.name);
        });
      }
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

  updateBoard() {

    this.form.updateValueAndValidity();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.form.disable();

    const updateBoardData = {
      id: this.form.value.id,
      name: this.form.value.name,
      boardStatuses: this.form.value.boardStatuses?.map((boardStatus) => {

        if (!boardStatus.id) {
          delete boardStatus.id;
        }

        return boardStatus;
      }),
    } as BoardUpdateData;

    this.abstractBoardsService()!.boardUpdate(updateBoardData).pipe(
      catchError(() => {
        this.form.enable();
        return NEVER;
      })
    ).subscribe(() => {
      this.close();
      this._snackBarService.open('Board has been updated', 3000);
    });
  }

  close() {
    this._dialogRef.close();
  }
}
