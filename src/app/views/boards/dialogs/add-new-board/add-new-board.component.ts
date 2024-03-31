import {DialogRef} from '@angular/cdk/dialog';
import {Component, Optional, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {ButtonComponent} from '../../../../components/button/button.component';
import {ErrorComponent} from '../../../../components/form/error/error.component';
import {FormFieldComponent} from '../../../../components/form/form-field/form-field.component';
import {InputComponent} from '../../../../components/form/input/input.component';
import {LabelComponent} from '../../../../components/form/label/label.component';
import {SvgDirective} from '../../../../directives/svg.directive';
import {AuthService} from '../../../../services/auth/auth.service';
import {FunctionsService} from '../../../../services/firebase/functions.service';
import {SnackBarService} from '../../../../services/snack-bar.service';
import {getProtectedRxjsPipe} from '../../../../utils/get-protected.rxjs-pipe';
import {CreateBoardData, CreateBoardResult} from '../../models/board';

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

  constructor(
    @Optional() private readonly _dialogRef: DialogRef<AddNewBoardComponent>,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService,
    private readonly _authService: AuthService
  ) {

    this._authService.user$.pipe(
      getProtectedRxjsPipe(),
      takeUntilDestroyed()
    ).subscribe((user) => {

      if (!user) {
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

    this._functionsService.httpsCallable<CreateBoardData, CreateBoardResult>('board-create', createBoardData).pipe(
      catchError(() => {
        this.form.enable();
        return NEVER;
      })
    ).subscribe(() => {
      this._dialogRef.close();
      this._snackBarService.open('Board has been created', 3000);
    });
  }

  close() {
    this._dialogRef?.close();
  }
}
