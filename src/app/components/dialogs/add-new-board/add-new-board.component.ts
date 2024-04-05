import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {CreateBoardData} from '../../../models/board';
import {BoardsService} from '../../../services/boards/boards.service';
import {SnackBarService} from '../../../services/snack-bar.service';
import {ButtonComponent} from '../../button/button.component';
import {ErrorComponent} from '../../form/error/error.component';
import {FormFieldComponent} from '../../form/form-field/form-field.component';
import {InputComponent} from '../../form/input/input.component';
import {LabelComponent} from '../../form/label/label.component';
import {LoaderComponent} from '../../loader/loader.component';

@Component({
  selector: 'app-add-new-board',
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
  templateUrl: './add-new-board.component.html',
  styleUrl: './add-new-board.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-add-new-board'
  }
})
export class AddNewBoardComponent {

  protected user = toSignal(this._boardsService.user$);
  protected storeType = toSignal(this._boardsService.storeType$);
  protected abstractBoardsService = toSignal(this._boardsService.abstractBoardsService$);

  protected form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    statusesNames: new FormArray<FormControl<string | null>>([])
  });

  constructor(
    private readonly _dialogRef: DialogRef<AddNewBoardComponent>,
    private readonly _boardsService: BoardsService,
    private readonly _snackBarService: SnackBarService
  ) {

    effect(() => {

      const user = this.user();
      const storeType = this.storeType();

      if (!user && storeType === 'firebase') {
        this.close();
      }
    });

    this.addNewStatusName();
  }

  addNewStatusName() {
    this.form.controls.statusesNames.push(new FormControl('', [Validators.required]));
  }

  createNewBoard() {

    this.form.updateValueAndValidity();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.form.disable();

    const createBoardData = {
      name: this.form.value.name,
      statusesNames: this.form.value.statusesNames
    } as CreateBoardData;

    this.abstractBoardsService()!.createBoard(createBoardData).pipe(
      catchError(() => {
        this.form.enable();
        return NEVER;
      })
    ).subscribe(() => {
      this.close();
      this._snackBarService.open('Board has been created', 3000);
    });
  }

  close() {
    this._dialogRef.close();
  }
}
