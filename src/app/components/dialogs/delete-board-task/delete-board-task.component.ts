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

  protected readonly _isRequesting = signal(false);
  protected readonly _board = this._boardService.boardSig.get();
  protected readonly _boardTask = this._boardService.boardTaskSig.get();

  constructor(
    private readonly _boardService: BoardService,
    private readonly _dialogRef: DialogRef<DeleteBoardTaskComponent>
  ) {

    effect(() => {

      const board = this._board();
      const boardTask = this._boardTask();

      if (!board && board !== undefined) {
        this.close();
        return;
      }

      if (board === undefined) {
        return;
      }

      if (!boardTask && boardTask !== undefined) {
        this.close();
      }
    });

    effect(() => {

      const isRequesting = this._isRequesting();
      const board = this._board();
      const boardTask = this._boardTask();

      if (!board || !boardTask || !isRequesting) {
        return;
      }

      this._boardService.boardTaskDelete({
        id: boardTask.id,
        boardId: board.id
      }).pipe(
        catchError(() => {
          this._isRequesting.set(false);
          return NEVER;
        })
      ).subscribe(() => {
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
