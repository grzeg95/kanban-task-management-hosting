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

  protected isRequesting = signal(false);
  protected board = this._boardService.getBoard();
  protected boardTask = this._boardService.getBoardTask();

  constructor(
    private readonly _boardService: BoardService,
    private readonly _dialogRef: DialogRef<DeleteBoardTaskComponent>
  ) {

    effect(() => {

      const board = this.board();
      const boardTask = this.boardTask();

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

      const isRequesting = this.isRequesting();
      const board = this.board();
      const boardTask = this.boardTask();

      if (!board || !boardTask || !isRequesting) {
        return;
      }

      this._boardService.boardTaskDelete({
        id: boardTask.id,
        boardId: board.id
      }).pipe(
        catchError(() => {
          this.isRequesting.set(false);
          return NEVER;
        })
      ).subscribe(() => {
        this.isRequesting.set(false);
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
