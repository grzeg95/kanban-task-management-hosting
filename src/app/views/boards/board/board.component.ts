import {Dialog} from '@angular/cdk/dialog';
import {NgStyle} from '@angular/common';
import {ChangeDetectionStrategy, Component, effect, OnDestroy, signal, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router} from '@angular/router';
import {catchError, map, NEVER, Subscription} from 'rxjs';
import {ButtonComponent} from '../../../components/button/button.component';
import {Status, StatusDoc} from '../../../models/boards/status';
import {Subtask, SubtaskDoc} from '../../../models/boards/subtask';
import {Task, TaskDoc} from '../../../models/boards/task';
import {AppService} from '../../../services/app.service';
import {AuthService} from '../../../services/auth/auth.service';
import {FirestoreService} from '../../../services/firebase/firestore.service';
import {LayoutService} from '../../../services/layout.service';
import {BoardsService} from '../boards.service';
import {EditBoardComponent} from '../dialogs/edit-board/edit-board.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    NgStyle,
    ButtonComponent
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-board'
  }
})
export class BoardComponent implements OnDestroy {

  protected statusesIndicators = ['#49C4E5', '#8471F2', '#67E2AE'];

  protected boardId = toSignal(this._activatedRoute.params.pipe(
    map((params) => params['id'])
  ));

  protected statuses = this._boardsService.statuses;
  protected statusPathTasks = this._boardsService.statusPathTasks;
  protected taskPathSubtasks = this._boardsService.taskPathSubtasks;

  private _statusesSub: Subscription | undefined;
  private _statusPathTasksSub = new Map<string, Subscription>;
  private _taskPathSubtasksSub = new Map<string, Subscription>;

  protected heightNav = this._layoutService.heightNav;

  constructor(
    private readonly _boardsService: BoardsService,
    private readonly _authService: AuthService,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _firestoreService: FirestoreService,
    private readonly _appService: AppService,
    private readonly _router: Router,
    private readonly _layoutService: LayoutService,
    private readonly _dialog: Dialog
  ) {

    effect(() => {

      const list = this._appService.list();
      const boardId = this.boardId();

      if (list && !list.find((item) => item.id === boardId)) {
        this._router.navigate(['../'], {relativeTo: this._activatedRoute});
        this._appService.select('');
        return;
      }

      if (boardId) {
        this._appService.select(boardId);
      }
    }, {allowSignalWrites: true});

    effect(() => {
      this.boardId();
      this.ngOnDestroy();
      this.statuses.set(undefined);
      this.statusPathTasks.set(undefined);
      this.taskPathSubtasks.set(undefined);
    }, {allowSignalWrites: true});

    effect(() => {

      const firebaseUser = this._authService.firebaseUser();

      this._unsubStatusesSub();

      if (firebaseUser) {

        this._statusesSub = this._firestoreService.collectionOnSnapshot<StatusDoc>(`users/${firebaseUser.uid}/boards/${this.boardId()}/statuses`).pipe(
          map((queryDocSnap) => {
            return queryDocSnap.docs.map((docSnap) => {
              return {
                id: docSnap.id,
                path: docSnap.ref.path,
                ...docSnap.data(),
              } as Status;
            });
          }),
          catchError(_ => NEVER)
        ).subscribe(this.statuses.set);
      }
    }, {allowSignalWrites: true});

    effect(() => {

      const statuses = this.statuses();

      if (!statuses) {
        return;
      }

      if (!this.statusPathTasks()) {
        this.statusPathTasks.set(new Map());
      }

      const currentStatusTasksPaths = [...this._statusPathTasksSub.keys()].toSet();
      const newStatusTasksPaths = statuses.map((status) => status.path + '/tasks').toSet();

      const toUnsubPaths = currentStatusTasksPaths.difference(newStatusTasksPaths).toArray();
      const toSubPaths = newStatusTasksPaths.difference(currentStatusTasksPaths).toArray();

      for (const toUnsubPath of toUnsubPaths) {
        this._statusPathTasksSub.get(toUnsubPath)?.unsubscribe();
        this._statusPathTasksSub.delete(toUnsubPath);
        this.statusPathTasks.update((statusPathTasks) => {
          statusPathTasks!.delete(toUnsubPath);
          return statusPathTasks;
        });
      }

      for (const toSubPath of toSubPaths) {
        const sub = this._firestoreService.collectionOnSnapshot<TaskDoc>(toSubPath).pipe(
          map((queryDocSnap) => {
            return queryDocSnap.docs.map((docSnap) => {
              return {
                id: docSnap.id,
                path: docSnap.ref.path,
                ...docSnap.data()
              } as Task;
            })
          }),
          catchError(_ => NEVER)
        ).subscribe((tasks) => {

          this.statusPathTasks.update((statusPathTasks) => {
            statusPathTasks!.set(toSubPath, tasks);
            return statusPathTasks;
          });
        });

        this._statusPathTasksSub.set(toSubPath, sub);
      }
    }, {allowSignalWrites: true});

    effect(() => {

      const statusPathTasks = this.statusPathTasks();

      if (!statusPathTasks) {
        return;
      }

      if (!this.taskPathSubtasks()) {
        this.taskPathSubtasks.set(new Map());
      }

      const currentTaskSubtasksPaths = [...this._taskPathSubtasksSub.keys()].toSet();
      const newTaskSubtasksPaths = [...statusPathTasks.keys()].map((path) => path + '/subtasks').toSet();

      const toUnsubPaths = currentTaskSubtasksPaths.difference(newTaskSubtasksPaths).toArray();
      const toSubPaths = newTaskSubtasksPaths.difference(currentTaskSubtasksPaths).toArray();

      for (const toUnsubPath of toUnsubPaths) {
        this._taskPathSubtasksSub.get(toUnsubPath)?.unsubscribe();
        this._taskPathSubtasksSub.delete(toUnsubPath);
        this.taskPathSubtasks.update((taskPathSubtasks) => {
          taskPathSubtasks!.delete(toUnsubPath);
          return taskPathSubtasks;
        });
      }

      for (const toSubPath of toSubPaths) {

        const sub = this._firestoreService.collectionOnSnapshot<SubtaskDoc>(toSubPath).pipe(
          map((queryDocSnap) => {
            return queryDocSnap.docs.map((docSnap) => {
              return {
                id: docSnap.id,
                path: docSnap.ref.path,
                ...docSnap.data()
              } as Subtask;
            })
          }),
          catchError(_ => NEVER)
        ).subscribe((subtasks) => {

          this.taskPathSubtasks.update((taskPathSubtasks) => {
            taskPathSubtasks!.set(toSubPath, subtasks);
            return taskPathSubtasks;
          });
        });

        this._taskPathSubtasksSub.set(toSubPath, sub);
      }
    }, {allowSignalWrites: true});
  }

  ngOnDestroy(): void {
    this._unsubStatusesSub();
    this._unsubStatusPathTasksSub();
    this._unsubTaskPathSubtasks();
  }

  private _unsubStatusesSub(): void {
    if (this._statusesSub && !this._statusesSub.closed) {
      this._statusesSub.unsubscribe();
    }
  }

  private _unsubStatusPathTasksSub(): void {
    this._statusPathTasksSub.forEach((statusPathTaskSub) => {
      statusPathTaskSub.unsubscribe();
    });
    this._statusPathTasksSub.clear();
  }

  private _unsubTaskPathSubtasks(): void {
    this._taskPathSubtasksSub.forEach((taskPathSubtaskSub) => {
      taskPathSubtaskSub.unsubscribe();
    });
    this._taskPathSubtasksSub.clear();
  }

  getCompletedSubtasks(subtasks: Subtask[] | undefined) {
    return subtasks?.reduce((cnt, subtask) => cnt + +subtask.isCompleted, 0) || 0;
  }

  openTaskDialog($event: KeyboardEvent | MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
  }

  openNewStatusDialog($event: KeyboardEvent | MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditBoardComponent, {
      data: {
        _boardsService: this._boardsService
      }
    });
  }

  openEditBoardDialog($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditBoardComponent, {
      data: {
        _boardsService: this._boardsService
      }
    });
  }
}
