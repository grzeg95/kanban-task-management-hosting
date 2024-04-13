import {DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {Component, computed, effect, Inject, signal, ViewEncapsulation} from '@angular/core';
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
  protected boardTasks = toSignal(this._boardsService.boardTasks$);
  protected boardStatuses = toSignal(this._boardsService.boardStatuses$);
  protected abstractBoardsService = toSignal(this._boardsService.abstractBoardsService$);
  protected isLoading = signal(false);
  protected boardTaskId = '';
  protected task = computed(() => this.boardTasks()?.[this.boardTaskId]);

  constructor(
    @Inject(DIALOG_DATA) readonly data: {
      boardTaskId: string
    },
    private readonly _boardsService: BoardsService,
    private readonly _dialogRef: DialogRef<DeleteTaskComponent>,
    private readonly _snackBarService: SnackBarService
  ) {

    this.boardTaskId = data.boardTaskId;

    effect(() => {

      const board = this.board();
      const task = this.task();

      if (!board && board !== undefined) {
        this._snackBarService.open(`This board want's found`, 3000);
        this.close();
        return;
      }

      if (board === undefined) {
        return;
      }

      if (!task && task !== undefined) {
        this._snackBarService.open(`This board task want's found`, 3000);
        this.close();
        return;
      }
    });
  }

  deleteTask() {

    this.isLoading.set(true);
    this.abstractBoardsService()!.boardTaskDelete({
      id: this.boardTaskId,
      boardId: this.board()!.id
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
