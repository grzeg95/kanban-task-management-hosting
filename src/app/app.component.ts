import {animate, state, style, transition, trigger} from '@angular/animations';
import {Dialog} from '@angular/cdk/dialog';
import {NgStyle} from '@angular/common';
import {Component, computed, DestroyRef, effect, Inject, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {Firestore, limit} from 'firebase/firestore';
import isEqual from 'lodash/isEqual';
import {catchError, filter, map, of, Subscription, takeWhile} from 'rxjs';
import {fadeZoomInOutTrigger} from './animations/fade-zoom-in-out.trigger';
import {ButtonComponent, ButtonSize} from './components/button/button.component';
import {AddNewBordTaskComponent} from './components/dialogs/add-new-board-task/add-new-bord-task.component';
import {AddNewBoardComponent} from './components/dialogs/add-new-board/add-new-board.component';
import {DeleteBoardComponent} from './components/dialogs/delete-board/delete-board.component';
import {EditBoardComponent} from './components/dialogs/edit-board/edit-board.component';
import {NavComponent} from './components/nav/nav.component';
import {PopMenuItemComponent} from './components/pop-menu/pop-menu-item/pop-menu-item.component';
import {
  SideBarPhoneWrapperComponent
} from './components/side-bar-phone/side-bar-phone-wrapper/side-bar-phone-wrapper.component';
import {SideBarComponent} from './components/side-bar/side-bar.component';
import {SvgDirective} from './directives/svg.directive';
import {Board} from './models/board';
import {User} from './models/user';
import {UserBoard} from './models/user-board';
import {AuthService} from './services/auth.service';
import {BoardService} from './services/board.service';
import {collectionSnapshots, docSnapshots} from './services/firebase/firestore';
import {LayoutService, LayoutServiceStates} from './services/layout.service';
import {ThemeSelectorService} from './services/theme-selector.service';
import {FirestoreInjectionToken} from './tokens/firebase';
import {handleTabIndex} from './utils/handle-tabindex';
import {Sig} from './utils/Sig';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SideBarComponent,
    SideBarPhoneWrapperComponent,
    RouterOutlet,
    NavComponent,
    NgStyle,
    ButtonComponent,
    PopMenuItemComponent,
    SvgDirective
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-root'
  },
  animations: [
    trigger(
      'moveRouterOutletForSideBar',
      [
        state(
          'hidden',
          style({
            marginLeft: 0
          })
        ),
        state(
          'tablet',
          style({
            marginLeft: 261
          })
        ),
        state(
          'desktop',
          style({
            marginLeft: 300
          })
        ),
        transition(
          `${LayoutServiceStates.phone} <=> ${LayoutServiceStates.hidden}, ${LayoutServiceStates.tablet} <=> ${LayoutServiceStates.hidden}, ${LayoutServiceStates.desktop} <=> ${LayoutServiceStates.hidden}`,
          animate('0.333s ease-in-out'),
        )
      ]
    ),
    fadeZoomInOutTrigger
  ]
})
export class AppComponent {

  protected readonly _user = this._authService.userSig.get();

  private readonly _userBoardsSig = new Sig<UserBoard[] | null | undefined>(undefined);
  protected readonly _userBoards = this._userBoardsSig.get();
  private _userBoardsSub: Subscription | undefined;

  private _boardSub: Subscription | undefined;

  protected readonly _loadingUserBoards = this._boardService.loadingUserBoardsSig.get();
  protected readonly _board = this._boardService.boardSig.get();
  protected readonly _boardId = this._boardService.boardIdSig.get();
  protected readonly _isOnPhone = this._layoutService.isOnPhoneSig.get();
  protected readonly _moveRouterOutletForSideBar = this._layoutService.moveForSideBarStateSig.get();
  protected readonly _heightNav = this._layoutService.heightNavSig.get();
  protected readonly _showSideBar = this._layoutService.showSideBarSig.get();
  protected readonly _isLoggedIn = this._authService.isLoggedIn;
  protected readonly _authStateReady = this._authService.authStateReady;
  protected readonly _darkMode = this._themeSelectorService.darkModeSig.get();

  protected readonly _userBoardsSorted = computed(() => {

    const user = this._user();
    const userBoards = this._userBoards();

    if (!user || !userBoards) {
      return null;
    }

    const userBoardsMap = new Map<string, UserBoard>();

    for (const userBoard of userBoards) {
      userBoardsMap.set(userBoard.id, userBoard);
    }

    return user.boardsIds
      .map((boardId) => userBoardsMap.get(boardId))
      .filter((userBoard) => !!userBoard) as UserBoard[];
  });

  protected readonly _navTitle = computed(() => {

    const isLoggedIn = this._isLoggedIn();
    const userBoards = this._userBoards();

    const board = this._board();

    if (!isLoggedIn) {
      return 'App';
    }

    if (userBoards === null || userBoards?.length === 0) {
      return 'Create Board';
    }

    if (board) {
      return board.name;
    }

    return 'Select Board';
  });

  protected readonly _tabIndexSideBar = computed(() => {

    const isOnPhone = this._isOnPhone();
    const showSideBar = this._showSideBar();

    if (isOnPhone && showSideBar || !showSideBar) {
      return -1;
    }

    return 0;
  });

  navButtonSize = computed(() => {

    let buttonSize: ButtonSize = 'large';

    if (this._isOnPhone()) {
      buttonSize = 'small';
    }

    return buttonSize;
  });

  constructor(
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore,
    private readonly _authService: AuthService,
    private readonly _boardService: BoardService,
    private readonly _layoutService: LayoutService,
    private readonly _dialog: Dialog,
    private readonly _router: Router,
    private readonly _themeSelectorService: ThemeSelectorService,
    private readonly _destroyRef: DestroyRef
  ) {

    this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
    ).subscribe((navigationEnd) => {

      const regex = /^\/([a-zA-Z\d]+)$/gm;
      const boardId = (regex.exec(navigationEnd.url) || [])[1];

      if (boardId) {
        this._boardService.boardIdSig.set(boardId);
      }
    });

    // userBoards
    let userBoards_userId: string | undefined;
    let userBoards_userBoardsIds: string[] | undefined;
    let userBoards_userConfigMaxUserBoards: number | undefined;
    effect(() => {

      const user = this._user();
      const authStateReady = this._authStateReady();

      if (!authStateReady) {
        return;
      }

      if (!user) {
        this._userBoardsSig.set(null);
        userBoards_userId = undefined;
        userBoards_userBoardsIds = undefined;
        userBoards_userConfigMaxUserBoards = undefined;
        this._userBoardsSub && !this._userBoardsSub.closed && this._userBoardsSub.unsubscribe();
        return;
      }

      if (
        userBoards_userId === user.id &&
        isEqual(userBoards_userBoardsIds, user.boardsIds) &&
        userBoards_userConfigMaxUserBoards === user.config.maxUserBoards &&
        this._userBoardsSub && !this._userBoardsSub.closed
      ) {
        return;
      }

      userBoards_userId = user.id;
      userBoards_userBoardsIds = user.boardsIds;
      userBoards_userConfigMaxUserBoards = user.config.maxUserBoards;

      const userBoardCollectionRef = UserBoard.firestoreCollectionRef(User.firestoreRef(this._firestore, userBoards_userId));

      this._boardService.loadingUserBoardsSig.set(true);
      this._userBoardsSub && !this._userBoardsSub.closed && this._userBoardsSub.unsubscribe();
      this._userBoardsSub = collectionSnapshots(userBoardCollectionRef, limit(userBoards_userConfigMaxUserBoards)).pipe(
        takeUntilDestroyed(this._destroyRef),
        takeWhile(() => !!this._user()),
        catchError(() => of(null))
      ).subscribe((querySnapUserBoards) => {

        this._boardService.loadingUserBoardsSig.set(false);

        if (!querySnapUserBoards) {
          this._userBoardsSig.set(undefined);
          return;
        }

        const userBoards = [];

        for (const queryDocSnapUserBoard of querySnapUserBoards.docs) {
          userBoards.push(UserBoard.firestoreData(queryDocSnapUserBoard));
        }

        this._userBoardsSig.set(userBoards);
      });
    });

    // board
    let board_userId: string | undefined;
    let board_boardId: string | undefined;
    effect(() => {

      const user = this._user();
      const boardId = this._boardId();

      if (!user || !boardId) {
        this._router.navigate(['/']);
        this._boardService.boardSig.set(null);
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
          this._boardService.boardIdSig.set(undefined);
          board_userId = undefined;
          board_boardId = undefined;
          this._boardSub && !this._boardSub.closed && this._boardSub.unsubscribe();
          return;
        }

        this._boardService.boardSig.set(board);
      });
    });
  }

  openAddBoardDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(AddNewBoardComponent, {
      data: {
        _boardService: this._boardService
      }
    });
  }

  openEditBoardDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(EditBoardComponent, {
      data: {
        _boardService: this._boardService
      }
    });
  }

  openDeleteBoardDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(DeleteBoardComponent, {
      data: {
        _boardService: this._boardService
      }
    });
  }

  openAddTaskDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(AddNewBordTaskComponent, {
      data: {
        _boardService: this._boardService
      }
    });
  }

  setShowSideBar($event: KeyboardEvent | MouseEvent, value: boolean) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    if ($event instanceof KeyboardEvent) {
      if ($event.code !== 'Space' && $event.code !== 'Enter') {
        return;
      }
    }

    this._layoutService.showSideBarSig.set(value);
  }

  setShowNavMenuOptions(value: boolean) {
    this._layoutService.showNavMenuOptionsSig.set(value);
  }

  select(boardId: string) {
    this._router.navigate(['/', boardId]);
    this._boardService.boardIdSig.set(boardId);
  }

  signInAnonymously(): Promise<void> {
    this._router.navigate(['/']);
    return this._authService.signInAnonymously();
  }
}
