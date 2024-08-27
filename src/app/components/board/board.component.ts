import {Dialog} from '@angular/cdk/dialog';
import {NgStyle} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  HostBinding,
  Inject,
  OnDestroy,
  ViewEncapsulation
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router} from '@angular/router';
import {Firestore, limit} from 'firebase/firestore';
import {catchError, map, of, Subscription, takeWhile} from 'rxjs';
import {fadeZoomInOutTrigger} from '../../animations/fade-zoom-in-out.trigger';
import {Board} from '../../models/board';
import {BoardStatus} from '../../models/board-status';
import {BoardTask} from '../../models/board-task';
import {BoardTaskSubtask} from '../../models/board-task-subtask';
import {AuthService} from '../../services/auth.service';
import {BoardService} from '../../services/board.service';
import {collectionSnapshots, docSnapshots} from '../../services/firebase/firestore';
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

  protected readonly _showSideBar = this._layoutService.showSideBarSig.get();

  protected readonly _heightNav = this._layoutService.heightNavSig.get();
  protected readonly _isOnPhone = this._layoutService.isOnPhoneSig.get();

  protected readonly _board = this._boardService.boardSig.get();
  private _boardSub: Subscription | undefined;

  protected readonly _boardId = this._boardService.boardIdSig.get();

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

  private _boardStatusesSub: Subscription | undefined;
  private _boardTasksSub: Subscription | undefined;
  private _boardTaskSubtasksSub: Subscription | undefined;

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
    private readonly _destroyRef: DestroyRef
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
      this._boardService.boardIdSig.set(id);
    });

    // board
    let board_userId: string | undefined;
    let board_boardId: string | undefined;
    effect(() => {

      const user = this._user();
      const boardId = this._boardId();

      if (user === undefined || boardId === undefined) {
        return;
      }

      if (!user || !boardId) {
        this._router.navigate(['/']);
        this._boardService.boardSig.set(undefined);
        this._boardService.loadingBoardSig.set(false);
        board_userId = undefined;
        board_boardId = undefined;
        this._boardSub && !this._boardSub.closed && this._boardSub.unsubscribe();
        return;
      }

      if (
        board_userId === user.id &&
        board_boardId === boardId
      ) {
        return;
      }

      board_userId = user.id;
      board_boardId = boardId;

      const boardRef = Board.firestoreRef(this._firestore, board_boardId);

      this._boardService.loadingBoardSig.set(true);
      this._boardSub && !this._boardSub.closed && this._boardSub.unsubscribe();
      this._boardSub = docSnapshots(boardRef).pipe(
        takeUntilDestroyed(this._destroyRef),
        takeWhile(() => !!this._boardId()),
        map((docSnap) => Board.firestoreData(docSnap)),
        catchError(() => of(null))
      ).subscribe((board) => {

        this._boardService.loadingBoardSig.set(false);

        if (!board || !board.exists) {
          this._boardService.boardSig.set(undefined);
          this._boardService.boardIdSig.set(null);
          board_userId = undefined;
          board_boardId = undefined;
          this._boardSub && !this._boardSub.closed && this._boardSub.unsubscribe();
          return;
        }

        this._boardService.boardSig.set(board);
      });
    });

    // boardStatuses
    let boardStatuses_userId: string | undefined;
    let boardStatuses_userConfigMaxBoardStatuses: number | undefined;
    let boardStatuses_boardId: string | undefined;
    effect(() => {

      const user = this._user();
      const board = this._board();

      if (!user || !board) {
        this._boardService.boardStatusesSig.set(undefined);
        this._boardService.loadingBoardStatusesSig.set(false);
        boardStatuses_userId = undefined;
        boardStatuses_userConfigMaxBoardStatuses = undefined;
        boardStatuses_boardId = undefined;
        this._boardStatusesSub && !this._boardStatusesSub.closed && this._boardStatusesSub.unsubscribe();
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
      this._boardStatusesSub && !this._boardStatusesSub.closed && this._boardStatusesSub.unsubscribe();
      this._boardStatusesSub = collectionSnapshots(boardStatusesRef, limit(boardStatuses_userConfigMaxBoardStatuses)).pipe(
        takeUntilDestroyed(this._destroyRef),
        takeWhile(() => !!this._board() && !!this._user()),
        catchError(() => of(null))
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

      const user = this._user();
      const board = this._board();

      if (!user || !board) {
        this._boardService.boardTasksSig.set(undefined);
        this._boardService.loadingBoardTasksSig.set(false);
        boardTasks_userId = undefined;
        boardStatuses_userConfigMaxBoardTasks = undefined;
        this._boardTasksSub && !this._boardTasksSub.closed && this._boardTasksSub.unsubscribe();
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
      this._boardTasksSub && !this._boardTasksSub.closed && this._boardTasksSub.unsubscribe();
      this._boardTasksSub = collectionSnapshots(boardTasksRef, limit(boardStatuses_userConfigMaxBoardTasks)).pipe(
        takeUntilDestroyed(this._destroyRef),
        takeWhile(() => !!this._board() && !!this._user()),
        catchError(() => of(null))
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
      const user = this._user();

      if (!board || !boardTask || !user) {
        this._boardService.boardTaskSubtasksSig.set(undefined);
        this._boardService.loadingBoardTaskSubtasksSig.set(false);
        boardTaskSubtasks_userId = undefined;
        boardTaskSubtasks_boardId = undefined;
        boardTaskSubtasks_boardTaskId = undefined;
        this._boardTaskSubtasksSub && !this._boardTaskSubtasksSub.closed && this._boardTaskSubtasksSub.unsubscribe();
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
      this._boardTaskSubtasksSub && !this._boardTaskSubtasksSub.closed && this._boardTaskSubtasksSub.unsubscribe();
      this._boardTaskSubtasksSub = collectionSnapshots(boardTaskSubtasksRef, limit(user.config.maxBoardTaskSubtasks)).pipe(
        takeUntilDestroyed(this._destroyRef),
        takeWhile(() => !!this._board() && !!this._boardTask() && !!this._user()),
        catchError(() => of(null))
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
    this._boardService.boardSig.set(undefined);
    this._boardService.loadingBoardSig.set(false);
    this._boardService.boardStatusesSig.set(undefined);
    this._boardService.loadingBoardStatusesSig.set(false);
    this._boardService.boardTasksSig.set(undefined);
    this._boardService.loadingBoardTasksSig.set(false);
    this._boardService.boardTaskSubtasksSig.set(undefined);
    this._boardService.loadingBoardTaskSubtasksSig.set(false);
    this._boardService.boardTaskSig.set(undefined);
    this._boardService.boardTaskSubtasksSig.set(undefined);
    this._boardService.loadingBoardTaskSubtasksSig.set(false);
  }
}
