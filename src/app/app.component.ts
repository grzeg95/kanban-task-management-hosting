import {animate, state, style, transition, trigger} from '@angular/animations';
import {Dialog} from '@angular/cdk/dialog';
import {AsyncPipe, NgStyle} from '@angular/common';
import {Component, DestroyRef, Inject, OnInit, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {User as FirebaseUser} from 'firebase/auth';
import {Firestore, limit} from 'firebase/firestore';
import isEqual from 'lodash/isEqual';
import {BehaviorSubject, catchError, combineLatest, filter, map, of, Subscription, tap} from 'rxjs';
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
import {User} from './models/user';
import {UserBoard} from './models/user-board';
import {AuthService} from './services/auth.service';
import {BoardService} from './services/board.service';
import {collectionSnapshots} from './services/firebase/firestore';
import {LayoutService, LayoutServiceStates} from './services/layout.service';
import {FirestoreInjectionToken} from './tokens/firebase';
import {handleTabIndex} from './utils/handle-tabindex';

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
    SvgDirective,
    AsyncPipe
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
export class AppComponent implements OnInit {

  protected readonly _user$ = this._authService.user$;
  protected readonly _firebaseUser$ = this._authService.firebaseUser$;

  protected readonly _userBoards$ = new BehaviorSubject<UserBoard[] | null | undefined>(undefined);
  private _userBoardsSub: Subscription | undefined;

  protected readonly _loadingUserBoards$ = this._boardService.loadingUserBoards$;
  protected readonly _board$ = this._boardService.board$;
  protected readonly _boardId$ = this._boardService.boardId$;
  protected readonly _isOnPhone$ = this._layoutService.isOnPhone$;
  protected readonly _moveRouterOutletForSideBar$ = this._layoutService.moveForSideBarState$;
  protected readonly _heightNav$ = this._layoutService.heightNav$;
  protected readonly _showSideBar$ = this._layoutService.showSideBar$;
  protected readonly _isLoggedIn$ = this._authService.isLoggedIn$;
  protected readonly _authStateReady$ = this._authService.authStateReady$;
  protected readonly _loadingUser$ = this._authService.loadingUser$;

  protected get _showSideBar() {
    return this._showSideBar$.value;
  }

  protected readonly _userBoardsSorted$ = combineLatest([
    this._user$,
    this._userBoards$
  ]).pipe(
    map(([
      user,
      userBoards
    ]) => {

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
    })
  );

  protected readonly _navTitle$ = combineLatest([
    this._userBoards$,
    this._board$,
    this._boardId$,
    this._loadingUser$
  ]).pipe(
    map(([
      userBoards,
      board,
      boardId
    ]) => {

      if (boardId && board === undefined || userBoards === undefined) {
        return 'Loading...';
      }

      if (userBoards === null || userBoards?.length === 0) {
        return 'Create Board';
      }

      if (board) {
        return board.name;
      }

      return 'Select Board';
    })
  );

  protected readonly _tabIndexSideBar$ = combineLatest([
    this._isOnPhone$,
    this._showSideBar$
  ]).pipe(
    map(([
      isOnPhone,
      showSideBar
    ]) => {
      if (isOnPhone && showSideBar || !showSideBar) {
        return -1;
      }

      return 0;
    })
  );

  protected readonly _navButtonSize$ = combineLatest([
    this._isOnPhone$
  ]).pipe(
    map(([
      isOnPhone
    ]) => {

      let buttonSize: ButtonSize = 'large';

      if (isOnPhone) {
        buttonSize = 'small';
      }

      return buttonSize;
    })
  );

  constructor(
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore,
    private readonly _authService: AuthService,
    private readonly _boardService: BoardService,
    private readonly _layoutService: LayoutService,
    private readonly _dialog: Dialog,
    private readonly _router: Router,
    private readonly _destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {

    this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
    ).subscribe((navigationEnd) => {

      const regex = /^\/([a-zA-Z\d]+)$/gm;
      const boardId = (regex.exec(navigationEnd.url) || [])[1];

      if (boardId) {
        this._boardService.boardId$.next(boardId);
      }
    });

    // userBoards
    let userBoards_userId: string | undefined;
    let userBoards_userBoardsIds: string[] | undefined;
    let userBoards_userConfigMaxUserBoards: number | undefined;
    let userBoards_firebaseUser: FirebaseUser | null;
    combineLatest([
      this._user$,
      this._firebaseUser$,
      this._authStateReady$,
      this._loadingUser$
    ]).pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe(([
      user,
      firebaseUser,
      authStateReady,
      loadingUser
    ]) => {

      if (!authStateReady) {
        return;
      }

      if (!user && !loadingUser) {
        this._userBoards$.next(null);
        userBoards_userId = undefined;
        userBoards_userBoardsIds = undefined;
        userBoards_userConfigMaxUserBoards = undefined;
        this._userBoardsSub && !this._userBoardsSub.closed && this._userBoardsSub.unsubscribe();
        return;
      }

      if (!user) {
        return;
      }

      if (
        userBoards_userId === user.id &&
        isEqual(userBoards_userBoardsIds, user.boardsIds) &&
        userBoards_userConfigMaxUserBoards === user.config.maxUserBoards &&
        this._userBoardsSub && !this._userBoardsSub.closed &&
        userBoards_firebaseUser === firebaseUser
      ) {
        return;
      }

      userBoards_userId = user.id;
      userBoards_userBoardsIds = user.boardsIds;
      userBoards_userConfigMaxUserBoards = user.config.maxUserBoards;
      userBoards_userConfigMaxUserBoards = user.config.maxUserBoards;
      userBoards_firebaseUser = firebaseUser;

      const userBoardCollectionRef = UserBoard.firestoreCollectionRef(User.firestoreRef(this._firestore, userBoards_userId));

      this._boardService.loadingUserBoards$.next(true);
      this._userBoardsSub && !this._userBoardsSub.closed && this._userBoardsSub.unsubscribe();
      this._userBoardsSub = collectionSnapshots(userBoardCollectionRef, limit(userBoards_userConfigMaxUserBoards)).pipe(
        takeUntilDestroyed(this._destroyRef),
        catchError(() => of(null))
      ).subscribe((querySnapUserBoards) => {

        this._boardService.loadingUserBoards$.next(false);

        if (!querySnapUserBoards) {
          this._userBoards$.next(undefined);
          return;
        }

        const userBoards = [];

        for (const queryDocSnapUserBoard of querySnapUserBoards.docs) {
          userBoards.push(UserBoard.firestoreData(queryDocSnapUserBoard));
        }

        this._userBoards$.next(userBoards);
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

    this._layoutService.showSideBar$.next(value);
  }

  setShowNavMenuOptions(value: boolean) {
    this._layoutService.showNavMenuOptions$.next(value);
  }

  select(boardId: string) {
    this._router.navigate(['/', boardId]);
    this._boardService.boardId$.next(boardId);
  }
}
