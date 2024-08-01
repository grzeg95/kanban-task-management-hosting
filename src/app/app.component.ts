import {animate, state, style, transition, trigger} from '@angular/animations';
import {Dialog} from '@angular/cdk/dialog';
import {NgStyle} from '@angular/common';
import {Component, computed, ViewEncapsulation} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {ButtonComponent} from './components/button/button.component';
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
import {UserBoard} from './models/user-board';
import {AuthService} from './services/auth.service';
import {BoardService} from './services/board.service';
import {LayoutService, LayoutServiceStates} from './services/layout.service';
import {ThemeSelectorService} from './services/theme-selector.service';
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
    )
  ]
})
export class AppComponent {

  protected readonly _user = this._boardService.user;
  protected readonly _userBoards = this._boardService.userBoardsSig.get();
  protected readonly _firstLoadingUserBoardsSig = this._boardService.firstLoadingUserBoardsSig.get();
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

  constructor(
    private readonly _authService: AuthService,
    private readonly _boardService: BoardService,
    private readonly _layoutService: LayoutService,
    private readonly _dialog: Dialog,
    private readonly _router: Router,
    private readonly _themeSelectorService: ThemeSelectorService
  ) {
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
  }

  signInAnonymously(): Promise<void> {
    this._router.navigate(['/']);
    return this._authService.signInAnonymously();
  }
}
