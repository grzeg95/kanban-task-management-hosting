import {DIALOG_DATA, DialogRef} from '@angular/cdk/dialog';
import {Component, DestroyRef, Inject, Input, Optional, signal, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import cloneDeep from 'lodash/cloneDeep';
import {BehaviorSubject, catchError, combineLatest, NEVER} from 'rxjs';
import {ButtonComponent} from '../../../../components/button/button.component';
import {CheckboxComponent} from '../../../../components/form/checkbox/checkbox.component';
import {ErrorComponent} from '../../../../components/form/error/error.component';
import {FormFieldComponent} from '../../../../components/form/form-field/form-field.component';
import {InputComponent} from '../../../../components/form/input/input.component';
import {LabelComponent} from '../../../../components/form/label/label.component';
import {SelectComponent} from '../../../../components/form/select/select.component';
import {TextareaComponent} from '../../../../components/form/textarea/textarea.component';
import {PopMenuItem} from '../../../../components/pop-menu/pop-menu-item/pop-menu-item.model';
import {SvgDirective} from '../../../../directives/svg.directive';
import {AuthService} from '../../../../services/auth/auth.service';
import {FirestoreService} from '../../../../services/firebase/firestore.service';
import {FunctionsService} from '../../../../services/firebase/functions.service';
import {getProtectedRxjsPipe} from '../../../../utils/get-protected.rxjs-pipe';
import {BoardsService} from '../../boards.service';
import {Board} from '../../models/board';
import {Task, UpdateTaskData, UpdateTaskResult} from '../../models/task';

@Component({
  selector: 'app-view-task',
  standalone: true,
  imports: [
    InputComponent,
    ButtonComponent,
    ReactiveFormsModule,
    SvgDirective,
    FormFieldComponent,
    LabelComponent,
    ErrorComponent,
    TextareaComponent,
    SelectComponent,
    CheckboxComponent,
    FormsModule
  ],
  templateUrl: './view-task.component.html',
  styleUrl: './view-task.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-view-task'
  }
})
export class ViewTaskComponent {

  wasUpdated = signal(false);
  isLoading = signal(false);

  board = signal<Board | undefined>(undefined);
  task = signal<Task | null | undefined>(undefined);
  statuses = signal<PopMenuItem[]>([]);

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
    @Optional() private readonly _dialogRef: DialogRef<ViewTaskComponent>,
    private readonly _firestoreService: FirestoreService,
    private readonly _authService: AuthService,
    private readonly _functionsService: FunctionsService,
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

      if (this.wasUpdated()) {
        this.wasUpdated.set(false);
        return;
      }

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

      const statuses = board.statusesIdsSequence.map((statusId) => board.statuses[statusId]).map((status) => {
        return {
          value: status.id,
          label: status.name
        } as PopMenuItem;
      });

      this.statuses.set(statuses);
    });
  }

  getCompletedSubtasks(task: Task) {
    return task.subtasksIdsSequence.reduce((cnt, subtaskId) => cnt + (+task.subtasks[subtaskId].isCompleted! || 0), 0) || 0;
  }

  close() {
    this.task.set(null);
    this.statuses.set([]);
    this._dialogRef?.close();
  }

  toggleSubtaskCompletion($event: MouseEvent, subtasksId: string, checked: boolean) {

    $event.preventDefault();
    $event.stopPropagation();

    const path = `users/${this._authService.user$.value?.id}/boards/${this.board()?.id}`;

    this._firestoreService.updateDoc(path, {
      [`statuses.${this._statusId$.value}.tasks.${this.taskId}.subtasks.${subtasksId}.isCompleted`]: checked
    }).subscribe();
  }

  onStatusChange(boardStatusId: string) {

    const board = this.board();
    const task = this.task();

    if (!board || !task) {
      return;
    }

    if (this._statusId$.value === boardStatusId) {
      return;
    }

    const updateTaskData: UpdateTaskData = {
      id: task.id,
      boardId: board.id,
      description: task.description,
      title: task.title,
      status: {
        id: this._statusId$.value,
        newId: boardStatusId
      },
      subtasks: task.subtasksIdsSequence.map((subtaskId) => ({
        id: task.subtasks[subtaskId].id,
        title: task.subtasks[subtaskId].title
      }))
    };

    this.isLoading.set(true);
    this.wasUpdated.set(true);
    this._functionsService.httpsCallable<UpdateTaskData, UpdateTaskResult>('task-update', updateTaskData).pipe(
      catchError(() => {
        this.isLoading.set(false);
        return NEVER;
      })
    ).subscribe(() => {
      this.isLoading.set(false);
      this._statusId$.next(boardStatusId);
    });
  }
}
