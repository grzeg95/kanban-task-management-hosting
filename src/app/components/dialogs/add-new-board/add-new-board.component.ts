import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, ViewEncapsulation} from '@angular/core';
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

  protected user = toSignal(this._boardService.user$);
  protected storeType = toSignal(this._boardService.storeType$);
  protected abstractBoardService = toSignal(this._boardService.abstractBoardService$);

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
      const storeType = this.storeType();

      if (!user && storeType === 'firebase') {
        this.close();
      }
    });

    this.addNewBoardStatusName();
  }

  addNewBoardStatusName() {
    this.form.controls.boardStatusesNames.push(new FormControl('', [Validators.required]));
  }

  boardCreate() {

    this.form.updateValueAndValidity();
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const abstractBoardService = this.abstractBoardService();

    if (abstractBoardService) {

      this.form.disable();

      const createBoardData = {
        name: this.form.value.name,
        boardStatusesNames: this.form.value.boardStatusesNames,
      } as BoardCreateData;

      abstractBoardService.boardCreate(createBoardData).pipe(
        catchError(() => {

          try {
            this.form.enable();
          } catch {
            /* empty */
          }

          return NEVER;
        })
      ).subscribe(() => {
        this.close();
      });
    }
  }

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }
}
