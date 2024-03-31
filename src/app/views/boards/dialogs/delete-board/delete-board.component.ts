import {DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {Component, Inject, Optional, signal, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {ButtonComponent} from '../../../../components/button/button.component';
import {ErrorComponent} from '../../../../components/form/error/error.component';
import {FormFieldComponent} from '../../../../components/form/form-field/form-field.component';
import {InputComponent} from '../../../../components/form/input/input.component';
import {LabelComponent} from '../../../../components/form/label/label.component';
import {SvgDirective} from '../../../../directives/svg.directive';
import {FunctionsService} from '../../../../services/firebase/functions.service';
import {SnackBarService} from '../../../../services/snack-bar.service';
import {getProtectedRxjsPipe} from '../../../../utils/get-protected.rxjs-pipe';
import {BoardsService} from '../../boards.service';
import {Board, DeleteBoardData, DeleteBoardResult} from '../../models/board';

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
    ErrorComponent
  ],
  templateUrl: './delete-board.component.html',
  styleUrl: './delete-board.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-delete-board'
  }
})
export class DeleteBoardComponent {

  board: Board | undefined;
  isLoading = signal(false);

  constructor(
    @Optional() private readonly _dialogRef: DialogRef<DeleteBoardComponent>,
    @Inject(DIALOG_DATA) readonly data: {_boardsService: BoardsService},
    @Optional() private readonly _boardsService: BoardsService,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService
  ) {

    if (data) {
      this._boardsService = data._boardsService;
    }

    this._boardsService.board$.pipe(
      getProtectedRxjsPipe(),
      takeUntilDestroyed()
    ).subscribe((board) => {

      if (!board) {
        this.close();
      }

      this.board = board;
    });
  }

  deleteBoard() {

    this.isLoading.set(true);
    this._functionsService.httpsCallable<DeleteBoardData, DeleteBoardResult>('board-delete', {id: this.board?.id!}).pipe(
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
    this._dialogRef?.close();
  }
}
