import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardService} from '../../../services/board/board.service';
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

  protected isDone = signal(false);
  protected isRequesting = signal(false);
  protected board = toSignal(this._boardService.board$);
  protected abstractBoardService = toSignal(this._boardService.abstractBoardService$);

  constructor(
    private readonly _dialogRef: DialogRef<DeleteBoardComponent>,
    private readonly _boardService: BoardService
  ) {

    effect(() => {

      const board = this.board();

      if (!board && board !== undefined) {
        this.close();
      }
    });

    effect(() => {

      if (this.isDone()) {
        this.close();
      }
    });

    effect(() => {

      const board = this.board();

      if (!this.isRequesting() || !board) {
        return;
      }

      this.abstractBoardService()?.boardDelete({id: board.id}).pipe(
        catchError(() => {
          this.isRequesting.set(false);
          return NEVER;
        })
      ).subscribe(() => {
        this.isDone.set(true);
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
