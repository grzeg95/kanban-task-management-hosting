import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardCreateData} from '../../../models/board';
import {BoardService} from '../../../services/board/board.service';
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

  protected isDone = signal(false);
  protected isRequesting = signal(false);
  protected user = this._boardService.user;

  protected form = new FormGroup({
    name: new FormControl('', [Validators.required]),
    boardStatusesNames: new FormArray<FormControl<string | null>>([])
  });

  constructor(
    private readonly _dialogRef: DialogRef<AddNewBoardComponent>,
    private readonly _boardService: BoardService
  ) {

    effect(() => {

      const user = this.user();

      if (!user) {
        this.close();
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

      const createBoardData = {
        name: this.form.value.name,
        boardStatusesNames: this.form.value.boardStatusesNames,
      } as BoardCreateData;

      this._boardService.boardCreate(createBoardData).pipe(
        catchError(() => {
          this.isRequesting.set(false);
          return NEVER;
        })
      ).subscribe(() => {
        this.isDone.set(true);
        this.isRequesting.set(false);
      });
    }, {allowSignalWrites: true});

    this.addNewBoardStatusName();
  }

  addNewBoardStatusName() {
    this.form.controls.boardStatusesNames.push(new FormControl('', [Validators.required]));
  }

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }
}
