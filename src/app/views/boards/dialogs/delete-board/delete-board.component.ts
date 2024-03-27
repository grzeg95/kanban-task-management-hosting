import {DialogRef} from '@angular/cdk/dialog';
import {ChangeDetectionStrategy, Component, Optional, signal, ViewEncapsulation} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {catchError, NEVER} from 'rxjs';
import {ButtonComponent} from '../../../../components/button/button.component';
import {ErrorComponent} from '../../../../components/form/error/error.component';
import {FormFieldComponent} from '../../../../components/form/form-field/form-field.component';
import {InputComponent} from '../../../../components/form/input/input.component';
import {LabelComponent} from '../../../../components/form/label/label.component';
import {SvgDirective} from '../../../../directives/svg.directive';
import {DeleteBoardData, DeleteBoardResult} from '../../../../models/boards/board';
import {AppService} from '../../../../services/app.service';
import {FunctionsService} from '../../../../services/firebase/functions.service';
import {SnackBarService} from '../../../../services/snack-bar.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-delete-board'
  }
})
export class DeleteBoardComponent {

  selectedBoard = this._appService.selected;
  isLoading = signal(false);

  constructor(
    @Optional() private readonly _dialogRef: DialogRef<DeleteBoardComponent>,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService,
    private readonly _appService: AppService
  ) {
  }

  deleteBoard() {

    this.isLoading.set(true);
    this._functionsService.httpsCallable<DeleteBoardData, DeleteBoardResult>('board-delete', {id: this.selectedBoard()!.id}).pipe(
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
