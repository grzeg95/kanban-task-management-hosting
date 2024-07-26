import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, signal, ViewEncapsulation} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardService} from '../../../services/board.service';
import {ButtonComponent} from '../../button/button.component';
import {ErrorComponent} from '../../form/error/error.component';
import {FormFieldComponent} from '../../form/form-field/form-field.component';
import {InputComponent} from '../../form/input/input.component';
import {LabelComponent} from '../../form/label/label.component';
import {LoaderComponent} from '../../loader/loader.component';

@Component({
  selector: 'app-delete-board',
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
  templateUrl: './delete-board.component.html',
  styleUrl: './delete-board.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-delete-board'
  }
})
export class DeleteBoardComponent {

  protected readonly _isDone = signal(false);
  protected readonly _isRequesting = signal(false);
  protected readonly _board = this._boardService.boardSig.get();

  constructor(
    private readonly _dialogRef: DialogRef<DeleteBoardComponent>,
    private readonly _boardService: BoardService
  ) {

    effect(() => {

      const board = this._board();

      if (!board && board !== undefined) {
        this.close();
      }
    });

    effect(() => {

      if (this._isDone()) {
        this.close();
      }
    });

    effect(() => {

      const board = this._board();

      if (!this._isRequesting() || !board) {
        return;
      }

      this._boardService.boardDelete({id: board.id}).pipe(
        catchError(() => {
          this._isRequesting.set(false);
          return NEVER;
        })
      ).subscribe(() => {
        this._isDone.set(true);
        this._isRequesting.set(false);
      });
    });
  }

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }
}
