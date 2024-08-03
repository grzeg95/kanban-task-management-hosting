import {Dialog} from '@angular/cdk/dialog';
import {NgStyle} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  HostBinding, Inject,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Firestore, limit} from 'firebase/firestore';
import {catchError, map, of, takeWhile} from 'rxjs';
import {fadeZoomInOutTrigger} from '../../animations/fade-zoom-in-out.trigger';
import {Board} from '../../models/board';
import {BoardStatus} from '../../models/board-status';
import {BoardTask} from '../../models/board-task';
import {BoardTaskSubtask} from '../../models/board-task-subtask';
import {AuthService} from '../../services/auth.service';
import {BoardService} from '../../services/board.service';
import {collectionSnapshots} from '../../services/firebase/firestore';
import {LayoutService} from '../../services/layout.service';
import {FirestoreInjectionToken} from '../../tokens/firebase';
import {Color} from '../../utils/color';
import {handleTabIndex} from '../../utils/handle-tabindex';
import {Sig} from '../../utils/Sig';
import {ButtonComponent} from '../button/button.component';
import {EditBoardComponent} from '../dialogs/edit-board/edit-board.component';
import {ViewBoardTaskComponent} from '../dialogs/view-board-task/view-board-task.component';
import {LoadingComponent} from '../loading/loading.component';

type BoardStatusView = BoardStatus & {
  boardTasks: BoardTask[]
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    NgStyle,
    ButtonComponent,
    LoadingComponent
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-board'
  },
  animations: [
    fadeZoomInOutTrigger
  ]
})
export class BoardComponent implements OnDestroy {

  @HostBinding('style.height') height = '';
  @HostBinding('style.width') width = '';

  private readonly _statusesColorStart = Color.hexStringColorToColor('#285be0');
  private readonly _statusesColorEnd = Color.hexStringColorToColor('#5bda6b');

  protected readonly _user = this._authService.userSig.get();
  protected readonly _authStateReady = this._authService.authStateReady;
  readonly loadedSig = new Sig(false);
  protected readonly _loaded = this.loadedSig.get();

  protected readonly _showSideBar = this._layoutService.showSideBarSig.get();

  protected readonly _heightNav = this._layoutService.heightNavSig.get();
  protected readonly _isOnPhone = this._layoutService.isOnPhoneSig.get();

  protected readonly _board = this._boardService.boardSig.get();
  protected readonly _boardStatuses = this._boardService.boardStatusesSig.get();
  protected readonly _boardTasks = this._boardService.boardTasksSig.get();

  protected readonly _boardView = computed(() => {

    const board = this._board();
    const boardStatuses = this._boardStatuses();
    const boardTasks = this._boardTasks();

    const boardStatusViews: BoardStatusView[] = [];

    if (!board || !boardStatuses || !boardTasks) {
      return boardStatusViews;
    }

    for (const boardStatusId of board.boardStatusesIds) {

      const _boardStatus = boardStatuses.get(boardStatusId);

      if (!_boardStatus) {
        continue;
      }

      const boardStatusView: BoardStatusView = {
        ..._boardStatus,
        boardTasks: [] as BoardTask[]
      };

      for (const boardStatusTaskId of boardStatusView.boardTasksIds) {

        const boardStatusTask = boardTasks.get(boardStatusTaskId);

        if (!boardStatusTask) {
          continue;
        }

        boardStatusView.boardTasks.push(boardStatusTask);
      }

      boardStatusViews.push(boardStatusView);
    }

    return boardStatusViews;
  });

  protected readonly _loadingBoard = this._boardService.loadingBoardSig.get();
  protected readonly _loadingBoardStatuses = this._boardService.loadingBoardStatusesSig.get();
  protected readonly _loadingBoardTasks = this._boardService.loadingBoardTasksSig.get();

  protected readonly boardTaskIdSig = this._boardService.boardTaskIdSig;
  protected readonly _boardTaskId = this.boardTaskIdSig.get();

  protected readonly boardTaskSig = this._boardService.boardTaskSig;
  protected readonly _boardTask = this.boardTaskSig.get();

  protected readonly _tabIndex = computed(() => {

    const isOnPhone = this._isOnPhone();
    const showSideBar = this._showSideBar();

    if (isOnPhone && showSideBar) {
      return -1;
    }

    return 0;
  });

  constructor(
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore,
    private readonly _boardService: BoardService,
    private readonly _authService: AuthService,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _router: Router,
    private readonly _layoutService: LayoutService,
    private readonly _dialog: Dialog,
    _destroyRef: DestroyRef
  ) {

    effect(() => {

      const loadingBoard = this._loadingBoard();
      const loadingBoardStatuses = this._loadingBoardStatuses();
      const loadingBoardTasks = this._loadingBoardTasks();

      const board = this._board();

      let height = '';
      let width = '';

      if (loadingBoard || loadingBoardStatuses || loadingBoardTasks || board?.boardStatusesIds.length === 0) {
        height = '100%';
        width = '100%';
      }

      setTimeout(() => {
        this.height = height;
        this.width = width;
      });
    });

    this._activatedRoute.params.pipe(
      map((params) => params['id'])
    ).subscribe((id) => {

      const loaded = this._loaded();

      if (loaded) {
        this.loadedSig.set(false);
        return;
      }

      const authStateReady = this._authStateReady();
      const user = this._user();

      if (loaded && authStateReady && !user) {
        this._router.navigate(['/']);
        return;
      }

      this._boardService.boardIdSig.set(id);
    });

    effect(() => {

      const loadingBoard = this._loadingBoard();
      const loadingBoardStatuses = this._loadingBoardStatuses();
      const loadingBoardTasks = this._loadingBoardTasks();

      const board = this._board();

      if (!loadingBoard || !loadingBoardStatuses || !loadingBoardTasks) {
        return;
      }

      if (!board && !loadingBoard) {
        this.loadedSig.set(true);
        this._router.navigate(['/']);
      }
    });

    // boardStatuses
    let boardStatuses_userId: string | undefined;
    let boardStatuses_userConfigMaxBoardStatuses: number | undefined;
    let boardStatuses_boardId: string | undefined;
    effect(() => {

      const user = this._boardService.user();
      const board = this._board();

      if (!user || !board) {
        this._boardService.boardStatusesSig.set(null);
        boardStatuses_userId = undefined;
        boardStatuses_userConfigMaxBoardStatuses = undefined;
        boardStatuses_boardId = undefined;
        this._boardService._boardStatusesSub && !this._boardService._boardStatusesSub.closed && this._boardService._boardStatusesSub.unsubscribe();
        return;
      }

      if (
        boardStatuses_userId === user.id &&
        boardStatuses_userConfigMaxBoardStatuses === user.config.maxBoardStatuses &&
        boardStatuses_boardId === board.id
      ) {
        return;
      }

      boardStatuses_userId = user.id;
      boardStatuses_userConfigMaxBoardStatuses = user.config.maxBoardStatuses;
      boardStatuses_boardId = board.id;

      const boardRef = Board.firestoreRef(this._firestore, boardStatuses_boardId);
      const boardStatusesRef = BoardStatus.firestoreCollectionRef(boardRef);

      this._boardService.loadingBoardStatusesSig.set(true);
      this._boardService._boardStatusesSub && !this._boardService._boardStatusesSub.closed && this._boardService._boardStatusesSub.unsubscribe();
      this._boardService._boardStatusesSub = collectionSnapshots(boardStatusesRef, limit(boardStatuses_userConfigMaxBoardStatuses)).pipe(
        catchError(() => of(null)),
        takeWhile(() => !!this._board() && !!this._boardService.user())
      ).subscribe((querySnapBoardStatuses) => {

        this._boardService.loadingBoardStatusesSig.set(false);

        if (!querySnapBoardStatuses) {
          this._boardService.boardStatusesSig.set(undefined);
          return;
        }

        const querySnapBoardStatusesMap = new Map<string, BoardStatus>();

        for (const queryDocSnapBoardStatus of querySnapBoardStatuses.docs) {
          querySnapBoardStatusesMap.set(queryDocSnapBoardStatus.id, BoardStatus.firestoreData(queryDocSnapBoardStatus));
        }

        this._boardService.boardStatusesSig.set(querySnapBoardStatusesMap);
      });
    });

    // boardTasks
    let boardTasks_userId: string | undefined;
    let boardStatuses_userConfigMaxBoardTasks: number | undefined;
    effect(() => {

      const user = this._boardService.user();
      const board = this._board();

      if (!user || !board) {
        this._boardService.boardTasksSig.set(null);
        boardTasks_userId = undefined;
        boardStatuses_userConfigMaxBoardTasks = undefined;
        this._boardService._boardTasksSub && !this._boardService._boardTasksSub.closed && this._boardService._boardTasksSub.unsubscribe();
        return;
      }

      if (
        boardTasks_userId === user.id &&
        boardStatuses_userConfigMaxBoardTasks === user.config.maxBoardTasks &&
        boardTasks_boardId === board.id
      ) {
        return;
      }

      boardTasks_userId = user.id;
      boardStatuses_userConfigMaxBoardTasks = user.config.maxBoardTasks;
      boardTasks_boardId = board.id;

      const boardRef = Board.firestoreRef(this._firestore, boardTasks_boardId);
      const boardTasksRef = BoardTask.firestoreCollectionRef(boardRef);

      this._boardService.loadingBoardTasksSig.set(true);
      this._boardService._boardTasksSub && !this._boardService._boardTasksSub.closed && this._boardService._boardTasksSub.unsubscribe();
      this._boardService._boardTasksSub = collectionSnapshots(boardTasksRef, limit(boardStatuses_userConfigMaxBoardTasks)).pipe(
        catchError(() => of(null)),
        takeWhile(() => !!this._board() && !!this._boardService.user())
      ).subscribe((querySnapBoardTasks) => {

        this._boardService.loadingBoardTasksSig.set(false);

        if (!querySnapBoardTasks) {
          this._boardService.boardTasksSig.set(undefined);
          return;
        }

        const querySnapUserBoardTasksMap = new Map<string, BoardTask>();

        for (const queryDocSnapBoardTask of querySnapBoardTasks.docs) {
          querySnapUserBoardTasksMap.set(queryDocSnapBoardTask.id, BoardTask.firestoreData(queryDocSnapBoardTask));
        }

        this._boardService.boardTasksSig.set(querySnapUserBoardTasksMap);
      });
    });
    let boardTasks_boardId: string | undefined;

    // boardTask
    effect(() => {

      const boardTasks = this._boardTasks();
      const boardTaskId = this._boardTaskId();

      this._boardService.boardTaskSig.set(boardTasks?.get(boardTaskId || ''));
    });

    // boardTaskSubtasks
    let boardTaskSubtasks_userId: string | undefined;
    let boardTaskSubtasks_boardId: string | undefined;
    let boardTaskSubtasks_boardTaskId: string | undefined;
    effect(() => {

      const board = this._board();
      const boardTask = this._boardTask();
      const user = this._boardService.user();

      if (!board || !boardTask || !user) {
        this._boardService.boardTaskSubtasksSig.set(undefined);
        boardTaskSubtasks_userId = undefined;
        boardTaskSubtasks_boardId = undefined;
        boardTaskSubtasks_boardTaskId = undefined;
        this._boardService._boardTaskSubtasksSub && !this._boardService._boardTaskSubtasksSub.closed && this._boardService._boardTaskSubtasksSub.unsubscribe();
        return;
      }

      if (
        boardTaskSubtasks_userId === user.id &&
        boardTaskSubtasks_boardId === board.id &&
        boardTaskSubtasks_boardTaskId === boardTask.id
      ) {
        return;
      }

      boardTaskSubtasks_userId = user.id;
      boardTaskSubtasks_boardId = board.id;
      boardTaskSubtasks_boardTaskId = boardTask.id;

      const boardRef = Board.firestoreRef(this._firestore, boardTaskSubtasks_boardId);
      const boardTaskRef = BoardTask.firestoreRef(boardRef, boardTaskSubtasks_boardTaskId);
      const boardTaskSubtasksRef = BoardTaskSubtask.firestoreRefs(boardTaskRef);

      this._boardService.loadingBoardTaskSubtasksSig.set(true);
      this._boardService._boardTaskSubtasksSub && !this._boardService._boardTaskSubtasksSub.closed && this._boardService._boardTaskSubtasksSub.unsubscribe();
      this._boardService._boardTaskSubtasksSub = collectionSnapshots(boardTaskSubtasksRef, limit(user.config.maxBoardTaskSubtasks)).pipe(
        catchError(() => of(null)),
        takeWhile(() => !!this._board() && !!this._boardTask() && !!this._boardService.user())
      ).subscribe((querySnapBoardTaskSubtasks) => {

        this._boardService.loadingBoardTaskSubtasksSig.set(false);

        if (!querySnapBoardTaskSubtasks) {
          this._boardService.boardTaskSubtasksSig.set(undefined);
          return;
        }

        const querySnapUserBoardTaskSubtasksMap = new Map<string, BoardTaskSubtask>();

        for (const queryDocSnapBoardTaskSubtask of querySnapBoardTaskSubtasks.docs) {
          querySnapUserBoardTaskSubtasksMap.set(queryDocSnapBoardTaskSubtask.id, BoardTaskSubtask.firestoreData(queryDocSnapBoardTaskSubtask));
        }

        this._boardService.boardTaskSubtasksSig.set(querySnapUserBoardTaskSubtasksMap);
      });
    });
  }

  openTaskDialog($event: KeyboardEvent | MouseEvent, boardTaskId: string) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._boardService.boardTaskIdSig.set(boardTaskId);
    this._dialog.open(ViewBoardTaskComponent);
  }

  openEditBoardDialog($event: KeyboardEvent | MouseEvent) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditBoardComponent);
  }

  colorShift(progress: number): string {
    return Color.shift(this._statusesColorStart, this._statusesColorEnd, progress || 0).toRgbString();
  }

  ngOnDestroy() {
    this._boardService.boardIdSig.set(undefined);
  }
}
