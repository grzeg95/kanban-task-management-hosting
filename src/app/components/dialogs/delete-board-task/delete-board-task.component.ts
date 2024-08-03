import {DialogRef} from '@angular/cdk/dialog';
import {Component, effect, OnDestroy, signal, ViewEncapsulation} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {catchError, of} from 'rxjs';
import {fadeZoomInOutTrigger} from '../../../animations/fade-zoom-in-out.trigger';
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
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class DeleteBoardTaskComponent implements OnDestroy {

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
  }

  boardTaskDelete() {

    if (this._isRequesting()) {
      return;
    }

    const board = this._board();
    const boardTask = this._boardTask();

    if (!board || !boardTask) {
      return;
    }

    this._isRequesting.set(true);

    this._boardService.boardTaskDelete({
      id: boardTask.id,
      boardId: board.id
    }).pipe(
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

  close() {
    try {
      this._dialogRef.close();
    } catch {
      /* empty */
    }
  }

  ngOnDestroy(): void {
    this._boardService.boardTaskIdSig.set(undefined);
  }
}
