import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, signal, ViewEncapsulation} from '@angular/core';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, of} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardCreateData} from '../../../models/board';
import {AuthService} from '../../../services/auth.service';
import {BoardService} from '../../../services/board.service';
import {ButtonComponent} from '../../button/button.component';
import {ErrorComponent} from '../../form/error/error.component';
import {FormFieldComponent} from '../../form/form-field/form-field.component';
import {InputComponent} from '../../form/input/input.component';
import {LabelComponent} from '../../form/label/label.component';
import {LoaderComponent} from '../../loader/loader.component';
import {fadeZoomInOutTrigger} from "../../../animations/fade-zoom-in-out.trigger";
import {Sig} from "../../../utils/Sig";

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
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class AddNewBoardComponent {

  protected readonly _isRequesting = signal(false);
  protected readonly _user = this._authService.userSig.get();

  private readonly _viewIsReadyToShowSig = new Sig(1);
  protected readonly _viewIsReadyToShow = this._viewIsReadyToShowSig.get();

  protected readonly _form = new FormGroup({
    name: new FormControl('', Validators.required),
    boardStatusesNames: new FormArray<FormControl<string | null>>([])
  });

  constructor(
    private readonly _dialogRef: DialogRef<AddNewBoardComponent>,
    private readonly _boardService: BoardService,
    private readonly _authService: AuthService
  ) {

    effect(() => {

      const user = this._user();

      if (!user) {
        this.close();
      }

      this._viewIsReadyToShowSig.update((val) => (val || 1) - 1);
    });

    effect(() => {

      if (this._isRequesting()) {
        this._form.disable();
      } else {
        this._form.enable();
      }
    });

    this.addNewBoardStatusName();
  }

  boardCreate() {

    if (this._isRequesting()) {
      return;
    }

    this._form.updateValueAndValidity();
    this._form.markAllAsTouched();

    if (this._form.invalid) {
      return;
    }

    const createBoardData = {
      name: this._form.value.name,
      boardStatusesNames: this._form.value.boardStatusesNames,
    } as BoardCreateData;

    this._isRequesting.set(true);

    this._boardService.boardCreate(createBoardData).pipe(
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

  addNewBoardStatusName() {
    this._form.controls.boardStatusesNames.push(new FormControl('', [Validators.required]));
  }

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }
}
