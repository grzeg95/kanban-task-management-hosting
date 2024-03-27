import {Dialog} from '@angular/cdk/dialog';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  OnDestroy,
  signal,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {QuerySnapshot} from '@angular/fire/firestore';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {Subscription} from 'rxjs';
import {ButtonComponent} from '../../components/button/button.component';
import {PopMenuItemComponent} from '../../components/pop-menu/pop-menu-item/pop-menu-item.component';
import {SvgDirective} from '../../directives/svg.directive';
import {BoardDoc} from '../../models/boards/board';
import {MainListItem} from '../../models/main-list-item';
import {AppService} from '../../services/app.service';
import {AuthService} from '../../services/auth/auth.service';
import {FirestoreService} from '../../services/firebase/firestore.service';
import {LayoutService} from '../../services/layout.service';
import {AddNewBoardComponent} from './dialogs/add-new-board/add-new-board.component';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [
    ButtonComponent,
    PopMenuItemComponent,
    SvgDirective,
    RouterOutlet
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

  selected = this._appService.selected;
  list = this._appService.list;
  showSideBar = this._appService.showSideBar;

  protected isOnPhone = this._layoutService.isOnPhone;

  protected boards = signal<undefined | QuerySnapshot<BoardDoc>>(undefined);
  protected userDocSnap = this._authService.userDocSnap;

  private _boardsListSub: Subscription | undefined;

  select = this._appService.select;

  constructor(
    private readonly _appService: AppService,
    private readonly _layoutService: LayoutService,
    private readonly _authService: AuthService,
    private readonly _firestoreService: FirestoreService,
    private readonly _router: Router,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _dialog: Dialog
  ) {

    effect(() => {
      const selected = this._appService.selected();

      if (selected) {
        this._router.navigate(['./', selected?.id], {relativeTo: this._activatedRoute});
      }
    });

    effect(() => {
      const firebaseUser = this._authService.firebaseUser();

      this._unsubBoardsListSub();

      if (firebaseUser) {
        this._boardsListSub = this._firestoreService.collectionOnSnapshot<BoardDoc>(`users/${firebaseUser.uid}/boards`).subscribe(this.boards.set);
      }
    });

    effect(() => {

      const boards = this.boards();
      const userDocSnap = this.userDocSnap();

      if (!boards) {
        return;
      }

      const boardsIdsSequence = userDocSnap?.data()?.boardsIdsSequence || [];

      const boardsMap = boards.docs.reduce((map, queryDocSnap) => {
        map.set(queryDocSnap.id, {
          id: queryDocSnap.id,
          label: queryDocSnap.data().name,
          path: queryDocSnap.ref.path
        });

        return map;
      }, new Map<string, MainListItem>());

      this._appService.list.set(
        boardsIdsSequence.map(id => boardsMap.get(id)).filter(item => !!item) as MainListItem[]
      );
    }, {allowSignalWrites: true});
  }

  ngAfterViewInit(): void {
    this._appService.appNavButtonTemplateRef.set(this.appNavButtonTemplateRef);
    this._appService.appNavMenuButtonsTemplateRef.set(this.appNavMenuButtonsTemplateRef);
    this._appService.appNavSelectedLabelTemplateRef.set(this.appNavSelectedLabelTemplateRef);
    this._appService.appSideBarItemsTitleTemplateRef.set(this.appSideBarItemsTitleTemplateRef);
    this._appService.appSideBarItemsContainerTemplateRef.set(this.appSideBarItemsContainerTemplateRef);
    this._appService.appSideBarPhoneItemsTitleTemplateRef.set(this.appSideBarPhoneItemsTitleTemplateRef);
    this._appService.appSideBarPhoneItemsContainerTemplateRef.set(this.appSideBarPhoneItemsContainerTemplateRef);
  }

  ngOnDestroy(): void {
    this._appService.list.set(null);
    this._appService.selected.set(null);
    this._appService.appNavButtonTemplateRef.set(null);
    this._appService.appNavMenuButtonsTemplateRef.set(null);
    this._appService.appNavSelectedLabelTemplateRef.set(null);
    this._appService.appSideBarItemsTitleTemplateRef.set(null);
    this._appService.appSideBarItemsContainerTemplateRef.set(null);
    this._appService.appSideBarPhoneItemsTitleTemplateRef.set(null);
    this._appService.appSideBarPhoneItemsContainerTemplateRef.set(null);
  }

  openAddBoardDialog($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();

    this._dialog.open(AddNewBoardComponent);
  }

  openEditBoardDialog($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
  }

  openDeleteBoardDialog($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
  }

  private _unsubBoardsListSub() {
    if (this._boardsListSub && !this._boardsListSub.closed) {
      this._boardsListSub.unsubscribe();
    }
  }
}
