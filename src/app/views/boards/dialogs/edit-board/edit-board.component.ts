import {DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  effect,
  Inject,
  Optional,
  signal,
  ViewEncapsulation,
  WritableSignal
} from '@angular/core';
import {QuerySnapshot} from '@angular/fire/firestore';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {ButtonComponent} from '../../../../components/button/button.component';
import {ErrorComponent} from '../../../../components/form/error/error.component';
import {FormFieldComponent} from '../../../../components/form/form-field/form-field.component';
import {InputComponent} from '../../../../components/form/input/input.component';
import {LabelComponent} from '../../../../components/form/label/label.component';
import {SvgDirective} from '../../../../directives/svg.directive';
import {
  BoardDoc,
  CreateBoardData,
  CreateBoardResult,
  UpdateBoardData,
  UpdateBoardResult
} from '../../../../models/boards/board';
import {Status} from '../../../../models/boards/status';
import {AppService} from '../../../../services/app.service';
import {FunctionsService} from '../../../../services/firebase/functions.service';
import {SnackBarService} from '../../../../services/snack-bar.service';
import {BoardsService} from '../../boards.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-edit-board'
  }
})
export class EditBoardComponent {

  form = new FormGroup({
    id: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    statuses: new FormArray<FormGroup<{id: FormControl<string | null>, name: FormControl<string | null>}>>([])
  });

  selectedBoard = this._appService.selected;
  boards: WritableSignal<QuerySnapshot<BoardDoc> | undefined>;
  statuses: WritableSignal<Status[] | undefined>;

  constructor(
    @Inject(DIALOG_DATA) readonly data: {_boardsService: BoardsService},
    @Optional() private readonly _boardsService: BoardsService,
    @Optional() private readonly _dialogRef: DialogRef<EditBoardComponent>,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService,
    private readonly _appService: AppService
  ) {

    if (data) {
      this._boardsService = data._boardsService;
    }

    this.boards = this._boardsService.boards;
    this.statuses = this._boardsService.statuses;

    effect(() => {

      const selectedBoard = this.selectedBoard();
      const boards = this.boards();
      const statuses = this.statuses();

      if (!selectedBoard || !boards || !statuses) {
        return;
      }

      const board = boards.docs.find((queryDocSnap) => queryDocSnap.id === selectedBoard.id);
      const boardData = board?.data();

      if (!boardData) {
        return;
      }

      this.form.controls.id.setValue(selectedBoard.id);
      this.form.controls.name.setValue(boardData?.name);
      this.form.controls.statuses.reset();

      statuses.forEach((status) => {
        this.addNewColumn(status.id!, status.name);
      });

      this._cdr.detectChanges();
    });
  }

  addNewColumn(id: null | string = null, name = '') {
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
      this._snackBarService.open('Board has been created', 3000);
    });
  }
}
