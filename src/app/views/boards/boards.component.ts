import {Dialog} from '@angular/cdk/dialog';
import {AsyncPipe} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {ButtonComponent} from '../../components/button/button.component';
import {PopMenuItemComponent} from '../../components/pop-menu/pop-menu-item/pop-menu-item.component';
import {SvgDirective} from '../../directives/svg.directive';
import {AppService} from '../../services/app.service';
import {LayoutService} from '../../services/layout.service';
import {BoardsService} from './boards.service';
import {AddNewBoardComponent} from './dialogs/add-new-board/add-new-board.component';
import {DeleteBoardComponent} from './dialogs/delete-board/delete-board.component';
import {EditBoardComponent} from './dialogs/edit-board/edit-board.component';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [
    ButtonComponent,
    PopMenuItemComponent,
    SvgDirective,
    RouterOutlet,
    AsyncPipe
  ],
  templateUrl: './boards.component.html',
  styleUrl: './boards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-boards'
  }
})
export class BoardsComponent implements OnDestroy, AfterViewInit {

  @ViewChild('appNavButtonTemplateRef') appNavButtonTemplateRef!: TemplateRef<ButtonComponent>;
  @ViewChild('appNavMenuButtonsTemplateRef') appNavMenuButtonsTemplateRef!: TemplateRef<any>;
  @ViewChild('appNavSelectedLabelTemplateRef') appNavSelectedLabelTemplateRef!: TemplateRef<any>;
  @ViewChild('appSideBarItemsTitleTemplateRef') appSideBarItemsTitleTemplateRef!: TemplateRef<any>;
  @ViewChild('appSideBarItemsContainerTemplateRef') appSideBarItemsContainerTemplateRef!: TemplateRef<any>;
  @ViewChild('appSideBarPhoneItemsTitleTemplateRef') appSideBarPhoneItemsTitleTemplateRef!: TemplateRef<any>;
  @ViewChild('appSideBarPhoneItemsContainerTemplateRef') appSideBarPhoneItemsContainerTemplateRef!: TemplateRef<any>;

  protected selected = toSignal(this._appService.selected$);
  protected list = toSignal(this._appService.list$);
  protected showSideBar = toSignal(this._appService.showSideBar$);

  protected isOnPhone = toSignal(this._layoutService.isOnPhone$);

  constructor(
    private readonly _router: Router,
    private readonly _appService: AppService,
    private readonly _layoutService: LayoutService,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _dialog: Dialog,
    private readonly _boardsService: BoardsService
  ) {

    this._appService.selected$.pipe(
      takeUntilDestroyed()
    ).subscribe((selected) => {
      if (selected) {
        this._router.navigate(['./', selected?.id], {relativeTo: this._activatedRoute});
        this._boardsService.board$.next(undefined);
      }
    });
  }

  ngAfterViewInit(): void {
    this._appService.appNavButtonTemplateRef$.next(this.appNavButtonTemplateRef);
    this._appService.appNavMenuButtonsTemplateRef$.next(this.appNavMenuButtonsTemplateRef);
    this._appService.appNavSelectedLabelTemplateRef$.next(this.appNavSelectedLabelTemplateRef);
    this._appService.appSideBarItemsTitleTemplateRef$.next(this.appSideBarItemsTitleTemplateRef);
    this._appService.appSideBarItemsContainerTemplateRef$.next(this.appSideBarItemsContainerTemplateRef);
    this._appService.appSideBarPhoneItemsTitleTemplateRef$.next(this.appSideBarPhoneItemsTitleTemplateRef);
    this._appService.appSideBarPhoneItemsContainerTemplateRef$.next(this.appSideBarPhoneItemsContainerTemplateRef);
  }

  ngOnDestroy(): void {
    this._appService.list$.next(null);
    this._appService.selected$.next(null);
    this._appService.appNavButtonTemplateRef$.next(null);
    this._appService.appNavMenuButtonsTemplateRef$.next(null);
    this._appService.appNavSelectedLabelTemplateRef$.next(null);
    this._appService.appSideBarItemsTitleTemplateRef$.next(null);
    this._appService.appSideBarItemsContainerTemplateRef$.next(null);
    this._appService.appSideBarPhoneItemsTitleTemplateRef$.next(null);
    this._appService.appSideBarPhoneItemsContainerTemplateRef$.next(null);
  }

  openAddBoardDialog($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(AddNewBoardComponent);
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
  }

  setShowSideBar(value: boolean) {
    this._appService.showSideBar$.next(value);
  }

  select(id: string) {
    this._appService.select(id);
  }
}
