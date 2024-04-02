import {DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {Component, DestroyRef, Inject, Input, Optional, signal, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import cloneDeep from 'lodash/cloneDeep';
import {BehaviorSubject, catchError, combineLatest, NEVER} from 'rxjs';
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
import {DeleteTaskData, DeleteTaskResult, Task} from '../../models/task';

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
    ErrorComponent
  ],
  templateUrl: './delete-task.component.html',
  styleUrl: './delete-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-delete-task'
  }
})
export class DeleteTaskComponent {

  board = signal<Board | undefined>(undefined);
  task = signal<Task | null | undefined>(undefined);

  isLoading = signal(false);

  @Input({required: true}) statusId = '';
  private readonly _statusId$;

  @Input({required: true}) taskId = '';

  constructor(
    @Optional() @Inject(DIALOG_DATA) readonly data: {
      _boardsService: BoardsService,
      statusId: string,
      taskId: string
    },
    @Optional() private readonly _boardsService: BoardsService,
    @Optional() private readonly _dialogRef: DialogRef<DeleteTaskComponent>,
    private readonly _functionsService: FunctionsService,
    private readonly _snackBarService: SnackBarService,
    private readonly _destroyRef: DestroyRef
  ) {

    if (data) {
      this._boardsService = data._boardsService;
      this.statusId = data.statusId;
      this.taskId = data.taskId;
    }

    this._statusId$ = new BehaviorSubject<string>(this.statusId);
    this._observe();
  }

  private _observe() {

    combineLatest([
      this._boardsService.board$.pipe(getProtectedRxjsPipe()),
      this._statusId$.pipe(getProtectedRxjsPipe())
    ]).pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe(([nextBoard, statusId]) => {

      if (!nextBoard) {
        this.close();
        return;
      }

      const currentBoard = this.board();

      if (!currentBoard) {
        this.board.set(nextBoard);
      } else if (currentBoard.id !== nextBoard.id) {
        this.close();
        return;
      } else {
        this.board.set(nextBoard);
      }

      const board = this.board()!;

      const status = cloneDeep(board.statuses[statusId]);

      if (!status) {
        this.close();
        return;
      }

      const task = cloneDeep(status.tasks[this.taskId]);

      if (!task) {
        this.close();
        return;
      }

      this.task.set(task);
    });
  }

  deleteTask() {

    this.isLoading.set(true);
    this._functionsService.httpsCallable<DeleteTaskData, DeleteTaskResult>('task-delete', {
      id: this.task()!.id,
      boardId: this.board()!.id,
      boardStatusId: this._statusId$.value
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
    this._dialogRef?.close();
  }
}
