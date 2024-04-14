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
  selector: 'app-delete-board-task',
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
  templateUrl: './delete-board-task.component.html',
  styleUrl: './delete-board-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-delete-board-task'
  }
})
export class DeleteBoardTaskComponent {

  protected isRequesting = signal(false);
  protected board = toSignal(this._boardService.board$);
  protected boardStatuses = toSignal(this._boardService.boardStatuses$);
  protected abstractBoardService = toSignal(this._boardService.abstractBoardService$);
  protected boardTask = toSignal(this._boardService.boardTask$);

  constructor(
    private readonly _boardService: BoardService,
    private readonly _dialogRef: DialogRef<DeleteBoardTaskComponent>,
    private readonly _snackBarService: SnackBarService
  ) {

    effect(() => {

      const board = this.board();
      const boardTask = this.boardTask();

      if (!board && board !== undefined) {
        this._snackBarService.open(`This board want's found`, 3000);
        this.close();
        return;
      }

      if (board === undefined) {
        return;
      }

      if (!boardTask && boardTask !== undefined) {
        this._snackBarService.open(`This board task want's found`, 3000);
        this.close();
        return;
      }
    });
  }

  boardTaskDelete() {

    const board = this.board();
    const boardTask = this.boardTask();

    if (!board || !boardTask) {
      return;
    }

    const abstractBoardService = this.abstractBoardService();

    if (abstractBoardService) {

      this.isRequesting.set(true);

      abstractBoardService.boardTaskDelete({
        id: boardTask.id,
        boardId: board.id
      }).pipe(
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
      })
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
