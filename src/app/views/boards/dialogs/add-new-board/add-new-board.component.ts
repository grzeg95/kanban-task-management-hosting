import {DialogRef} from '@angular/cdk/dialog';
import {ChangeDetectionStrategy, Component, signal, ViewEncapsulation} from '@angular/core';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {ButtonComponent} from '../../../../components/button/button.component';
import {ErrorComponent} from '../../../../components/form/error/error.component';
import {FormFieldComponent} from '../../../../components/form/form-field/form-field.component';
import {InputComponent} from '../../../../components/form/input/input.component';
import {LabelComponent} from '../../../../components/form/label/label.component';
import {SvgDirective} from '../../../../directives/svg.directive';
import {CreateBoardData, CreateBoardResult} from '../../../../models/boards/board';
import {FunctionsService} from '../../../../services/firebase/functions.service';
import {SnackBarService} from '../../../../services/snack-bar.service';

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
    ErrorComponent
  ],
  templateUrl: './add-new-board.component.html',
  styleUrl: './add-new-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-add-new-board'
  }
})
export class AddNewBoardComponent {

  form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    statusesNames: new FormArray<FormControl<string | null>>([])
  });

  isLoading = signal(false);

  constructor(
    private readonly _dialogRef: DialogRef<AddNewBoardComponent>,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {
    this.addNewColumnName();
  }

  addNewColumnName() {
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

    this.isLoading.set(true);
    this._functionsService.httpsCallable<CreateBoardData, CreateBoardResult>('board-create', createBoardData).pipe(
      catchError(() => {
        this.isLoading.set(false);
        this.form.enable();
        return NEVER;
      })
    ).subscribe(() => {
      this._dialogRef.close();
      this._snackBarService.open('Board has been created', 3000);
    });
  }
}
