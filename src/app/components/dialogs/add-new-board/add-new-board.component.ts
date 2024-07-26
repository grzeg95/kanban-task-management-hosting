import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, signal, ViewEncapsulation} from '@angular/core';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardCreateData} from '../../../models/board';
import {BoardService} from '../../../services/board.service';
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

  protected readonly _isDone = signal(false);
  protected readonly _isRequesting = signal(false);
  protected readonly _user = this._boardService.user;

  protected readonly _form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    boardStatusesNames: new FormArray<FormControl<string | null>>([])
  });

  constructor(
    private readonly _dialogRef: DialogRef<AddNewBoardComponent>,
    private readonly _boardService: BoardService
  ) {

    effect(() => {

      const user = this._user();

      if (!user) {
        this.close();
      }
    });

    effect(() => {

      if (this._isDone()) {
        this.close();
      }
    });

    effect(() => {

      if (this._isRequesting()) {
        this._form.disable();
      } else {
        this._form.enable();
      }
    });

    effect(() => {

      if (!this._isRequesting()) {
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

      this._boardService.boardCreate(createBoardData).pipe(
        catchError(() => {
          this._isRequesting.set(false);
          return NEVER;
        })
      ).subscribe(() => {
        this._isDone.set(true);
        this._isRequesting.set(false);
      });
    });

    this.addNewBoardStatusName();
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
