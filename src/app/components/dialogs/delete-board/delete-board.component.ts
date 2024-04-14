import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardService} from '../../../services/board/board.service';
import {SnackBarService} from '../../../services/snack-bar.service';
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

  protected isRequesting = signal(false);
  protected board = toSignal(this._boardService.board$);
  protected abstractBoardService = toSignal(this._boardService.abstractBoardService$);

  constructor(
    private readonly _dialogRef: DialogRef<DeleteBoardComponent>,
    private readonly _boardService: BoardService,
    private readonly _snackBarService: SnackBarService
  ) {

    effect(() => {

      const board = this.board();

      if (!board && board !== undefined) {
        this._snackBarService.open(`This board want's found`, 3000);
        this.close();
        return;
      }
    });
  }

  boardDelete() {

    const board = this.board();

    if (!board) {
      return;
    }

    const abstractBoardService = this.abstractBoardService();

    if (abstractBoardService) {

      this.isRequesting.set(true);

      abstractBoardService.boardDelete({id: board.id}).pipe(
        catchError(() => {

          try {
            this.isRequesting.set(false);
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
