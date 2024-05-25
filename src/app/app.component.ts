import {animate, state, style, transition, trigger} from '@angular/animations';
import {Dialog} from '@angular/cdk/dialog';
import {AsyncPipe, NgStyle} from '@angular/common';
import {Component, computed, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Router, RouterOutlet} from '@angular/router';
import {combineLatest, take} from 'rxjs';
import {ButtonComponent} from './components/button/button.component';
import {AddNewBoardComponent} from './components/dialogs/add-new-board/add-new-board.component';
import {AddNewBordTaskComponent} from './components/dialogs/add-new-board-task/add-new-bord-task.component';
import {DeleteBoardComponent} from './components/dialogs/delete-board/delete-board.component';
import {EditBoardComponent} from './components/dialogs/edit-board/edit-board.component';
import {NavComponent} from './components/nav/nav.component';
import {PopMenuItemComponent} from './components/pop-menu/pop-menu-item/pop-menu-item.component';
import {
  SideBarPhoneWrapperComponent
} from './components/side-bar-phone/side-bar-phone-wrapper/side-bar-phone-wrapper.component';
import {SideBarComponent} from './components/side-bar/side-bar.component';
import {SvgDirective} from './directives/svg.directive';
import {AppService} from './services/app.service';
import {BoardService} from './services/board/board.service';
import {StorageBoardService} from './services/board/storage-board.service';
import {LayoutService} from './services/layout.service';
import {getProtectedRxjsPipe} from './utils/get-protected.rxjs-pipe';
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
          '* => hidden, hidden => phone, hidden => tablet, hidden => desktop',
          animate('0.333s ease-in-out'),
        )
      ]
    )
  ]
})
export class AppComponent {

  protected user = toSignal(this._boardService.user$);
  protected userBoards = toSignal(this._boardService.userBoards$);
  protected loadingUserBoards = toSignal(this._boardService.loadingUserBoards$);
  protected board = toSignal(this._boardService.board$);
  protected boardId = toSignal(this._boardService.boardId$);
  protected isOnPhone = toSignal(this._layoutService.isOnPhone$);
  protected moveRouterOutletForSideBar = toSignal(this._appService.moveForSideBarState$);
  protected heightNav = toSignal(this._layoutService.heightNav$);
  protected showSideBar = toSignal(this._appService.showSideBar$);
  protected storeType = toSignal(this._boardService.storeType$);
  protected abstractBoardService = toSignal(this._boardService.abstractBoardService$);
  protected loadingBoard = toSignal(this._boardService.loadingBoard$);

  protected navTitle = computed(() => {

    const user = this.user();
    const userBoards = this.userBoards();
    const loadingUserBoards = this.loadingUserBoards();
    const board = this.board();
    const loadingBoard = this.loadingBoard();

    if (!user) {
      return 'Kanban App';
    }

    if (loadingUserBoards || loadingUserBoards === undefined) {
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
    private readonly _boardService: BoardService,
    private readonly _layoutService: LayoutService,
    private readonly _dialog: Dialog,
    private readonly _router: Router
  ) {

    this._boardService.abstractBoardService$.pipe(
      take(1)
    ).subscribe((abstractBoardService) => {
      if (abstractBoardService instanceof StorageBoardService) {
        abstractBoardService.loadDefault();
      }
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

    this._appService.showSideBar$.next(value);
  }

  setShowNavMenuOptions(value: boolean) {
    this._appService.showNavMenuOptions$.next(value);
  }

  select(boardId: string) {
    this._router.navigate(['/', boardId]);
  }

  restoreDefault() {
    (this.abstractBoardService() as StorageBoardService)?.loadDefault();
  }
}
