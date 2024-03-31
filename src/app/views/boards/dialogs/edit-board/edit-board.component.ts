import {DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {Component, Inject, Optional, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {ButtonComponent} from '../../../../components/button/button.component';
import {ErrorComponent} from '../../../../components/form/error/error.component';
import {FormFieldComponent} from '../../../../components/form/form-field/form-field.component';
import {InputComponent} from '../../../../components/form/input/input.component';
import {LabelComponent} from '../../../../components/form/label/label.component';
import {SvgDirective} from '../../../../directives/svg.directive';
import {FunctionsService} from '../../../../services/firebase/functions.service';
import {SnackBarService} from '../../../../services/snack-bar.service';
import {getProtectedRxjsPipe} from '../../../../utils/get-protected.rxjs-pipe';
import {BoardsService} from '../../boards.service';
import {UpdateBoardData, UpdateBoardResult} from '../../models/board';

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
    ErrorComponent
  ],
  templateUrl: './edit-board.component.html',
  styleUrl: './edit-board.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-edit-board'
  }
})
export class EditBoardComponent {

  private board;

  form = new FormGroup({
    id: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    statuses: new FormArray<FormGroup<{id: FormControl<string | null>, name: FormControl<string | null>}>>([])
  });

  constructor(
    @Optional() @Inject(DIALOG_DATA) readonly data: {_boardsService: BoardsService},
    @Optional() private readonly _boardsService: BoardsService,
    @Optional() private readonly _dialogRef: DialogRef<EditBoardComponent>,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {

    if (data) {
      this._boardsService = data._boardsService;
    }

    this.board = this._boardsService.board$;

    this._boardsService.board$.pipe(
      getProtectedRxjsPipe(),
      takeUntilDestroyed()
    ).subscribe((board) => {

      if (!board) {
        this.close();
        return;
      }

      this.form.controls.id.setValue(board.id);
      this.form.controls.name.setValue(board.name);
      this.form.controls.statuses.reset();

      board.statusesIdsSequence.map((statusId) => board.statuses[statusId]).forEach((status) => {
        this.addNewStatusName(status.id, status.name);
      });
    });
  }

  addNewStatusName(id: null | string = null, name = '') {
    this.form.controls.statuses.push(
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
      statuses: this.form.value.statuses?.map((status) => {

        if (!status.id) {
          delete status.id;
        }

        return status;
      })
    } as UpdateBoardData;

    this._functionsService.httpsCallable<UpdateBoardData, UpdateBoardResult>('board-update', updateBoardData).pipe(
      catchError(() => {
        this.form.enable();
        return NEVER;
      })
    ).subscribe(() => {
      this._dialogRef.close();
      this._snackBarService.open('Board has been updated', 3000);
    });
  }

  close() {
    this._dialogRef?.close();
  }
}
