import {DialogRef} from '@angular/cdk/dialog';
import {Component, computed, effect, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {SvgDirective} from '../../../directives/svg.directive';
import {BoardsService} from '../../../services/boards/boards.service';
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

  protected board = toSignal(this._boardsService.board$);
  protected isLoading = signal(false);
  protected abstractBoardsService = toSignal(this._boardsService.abstractBoardsService$);

  constructor(
    private readonly _dialogRef: DialogRef<DeleteBoardComponent>,
    private readonly _boardsService: BoardsService,
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

  deleteBoard() {

    this.isLoading.set(true);
    this.abstractBoardsService()!.boardDelete({id: this.board()!.id}).pipe(
      catchError(() => {
        this.isLoading.set(false);
        return NEVER;
      })
    ).subscribe(() => {
      this.close();
      this._snackBarService.open('Board has been removed', 3000);
    });
  }

  close() {
    this._dialogRef.close();
  }
}
