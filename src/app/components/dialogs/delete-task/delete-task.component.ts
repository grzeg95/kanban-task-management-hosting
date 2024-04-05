import {DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {Component, computed, effect, Inject, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import cloneDeep from 'lodash/cloneDeep';
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
  selector: 'app-delete-task',
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
  templateUrl: './delete-task.component.html',
  styleUrl: './delete-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-delete-task'
  }
})
export class DeleteTaskComponent {

  protected board = toSignal(this._boardsService.board$);
  protected abstractBoardsService = toSignal(this._boardsService.abstractBoardsService$);
  protected isLoading = signal(false);
  protected statusId = '';
  protected taskId = '';
  protected taskTitle = computed(() => this.board()?.statuses[this.statusId]?.tasks[this.taskId]?.title || '' );

  constructor(
    @Inject(DIALOG_DATA) readonly data: {
      statusId: string,
      taskId: string
    },
    private readonly _boardsService: BoardsService,
    private readonly _dialogRef: DialogRef<DeleteTaskComponent>,
    private readonly _snackBarService: SnackBarService
  ) {

    this.statusId = data.statusId;
    this.taskId = data.statusId;

    effect(() => {

      const board = this.board();

      if (!board && board !== undefined) {
        this.close();
        return;
      }

      if (board === undefined) {
        return;
      }

      const task = cloneDeep(board.statuses[this.statusId].tasks[this.taskId]);

      if (!task) {
        this.close();
        return;
      }
    });
  }

  deleteTask() {

    this.isLoading.set(true);
    this.abstractBoardsService()!.deleteTask({
      id: this.taskId,
      boardId: this.board()!.id,
      boardStatusId: this.statusId
    }).pipe(
      catchError(() => {
        this.isLoading.set(false);
        return NEVER;
      })
    ).subscribe(() => {
      this.close();
      this._snackBarService.open('Task has been removed', 3000);
    });
  }

  close() {
    this._dialogRef.close();
  }
}
