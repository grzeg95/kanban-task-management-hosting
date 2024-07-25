import {animate, state, style, transition, trigger} from '@angular/animations';
import {Dialog} from '@angular/cdk/dialog';
import {NgStyle} from '@angular/common';
import {Component, computed, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
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
import {AppService} from './services/app.service';
import {AuthService} from './services/auth/auth.service';
import {BoardService} from './services/board.service';
import {LayoutService} from './services/layout.service';
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
          '* => hidden, hidden => phone, hidden => tablet, hidden => desktop',
          animate('0.333s ease-in-out'),
        )
      ]
    )
  ]
})
export class AppComponent {

  protected userSig = this._boardService.userSig;
  protected userBoards = this._boardService.getUserBoards();
  protected loadingUserBoards = this._boardService.getLoadingUserBoards();
  protected board = this._boardService.getBoard();
  protected boardId = this._boardService.getBoardId();
  protected isOnPhone = toSignal(this._layoutService.isOnPhone$);
  protected moveRouterOutletForSideBar = toSignal(this._appService.moveForSideBarState$);
  protected heightNav = toSignal(this._layoutService.heightNav$);
  protected showSideBar = toSignal(this._appService.showSideBar$);
  protected loadingBoard = this._boardService.getLoadingBoard();
  protected isLoggedIn = toSignal(this._authService.isLoggedIn$);

  protected userBoardsSorted = computed(() => {

    const user = this.userSig();
    const userBoards = this.userBoards();

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

  protected navTitle = computed(() => {

    const isLoggedIn = this.isLoggedIn();
    const userBoards = this.userBoards();
    const loadingUserBoards = this.loadingUserBoards();
    const board = this.board();
    const loadingBoard = this.loadingBoard();

    if (!isLoggedIn) {
      return 'Kanban App';
    }

    if (loadingUserBoards) {
      return 'Loading boards...';
    }

    if (userBoards === null || userBoards?.length === 0) {
      return 'Create Board';
    }

    if (loadingBoard) {
      return 'Loading board...';
    }

    if (board) {
      return board.name;
    }

    return 'Select Board';
  });

  protected tabIndexSideBar = computed(() => {

    const isOnPhone = this.isOnPhone();
    const showSideBar = this.showSideBar();

    if (isOnPhone && showSideBar || !showSideBar) {
      return -1;
    }

    return 0;
  });

  constructor(
    private readonly _appService: AppService,
    private readonly _authService: AuthService,
    private readonly _boardService: BoardService,
    private readonly _layoutService: LayoutService,
    private readonly _dialog: Dialog,
    private readonly _router: Router
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

    this._appService.showSideBar$.next(value);
  }

  setShowNavMenuOptions(value: boolean) {
    this._appService.showNavMenuOptions$.next(value);
  }

  select(boardId: string) {
    this._router.navigate(['/', boardId]);
  }
}
