import {animate, state, style, transition, trigger} from '@angular/animations';
import {Dialog} from '@angular/cdk/dialog';
import {AsyncPipe, NgStyle} from '@angular/common';
import {Component, computed, ViewEncapsulation} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Router, RouterOutlet} from '@angular/router';
import {ButtonComponent} from './components/button/button.component';
import {AddNewBoardComponent} from './components/dialogs/add-new-board/add-new-board.component';
import {AddNewTaskComponent} from './components/dialogs/add-new-task/add-new-task.component';
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
import {BoardsService} from './services/boards/boards.service';
import {InMemoryBoardsService} from './services/boards/in-memory-boards.service';
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

  protected boards = toSignal(this._boardsService.boards$);
  protected board = toSignal(this._boardsService.board$);
  protected boardId = toSignal(this._boardsService.boardId$);
  protected isOnPhone = toSignal(this._layoutService.isOnPhone$);
  protected moveRouterOutletForSideBar = toSignal(this._appService.moveForSideBarState$);
  protected heightNav = toSignal(this._layoutService.heightNav$);
  protected showSideBar = toSignal(this._appService.showSideBar$);
  protected storeType = toSignal(this._boardsService.storeType$);
  protected abstractBoardsService = toSignal(this._boardsService.abstractBoardsService$);
  protected selectingBoard = toSignal(this._boardsService.selectingBoard$);

  protected navTitle = computed(() => {

    const boards = this.boards();
    const board = this.board();
    const selectingBoard = this.selectingBoard();

    if (!boards) {
      return 'Loading boards...';
    }

    if (selectingBoard) {
      return 'Loading board...';
    }

    if (board) {
      return board.name;
    }

    if (boards.length === 0) {
      return 'Create Board';
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
    private readonly _boardsService: BoardsService,
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

  openDeleteBoardDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(DeleteBoardComponent, {
      data: {
        _boardsService: this._boardsService
      }
    });
  }

  openAddTaskDialog($event: MouseEvent) {

    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(AddNewTaskComponent, {
      data: {
        _boardsService: this._boardsService
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
    (this.abstractBoardsService() as InMemoryBoardsService)?.loadDefault();
  }
}
