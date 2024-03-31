import {Inject, Injectable, TemplateRef} from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';
import {BehaviorSubject, combineLatest} from 'rxjs';
import {MainListItem} from '../models/main-list-item';
import {AvailableUserViews, DefaultUserView, UnauthorizedView} from '../tokens/view';
import {LayoutService} from './layout.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  list$ = new BehaviorSubject<MainListItem[] | null | undefined>(undefined);

  selected$ = new BehaviorSubject<MainListItem | null | undefined>(undefined);
  showSideBar$ = new BehaviorSubject<boolean>(true);

  moveForSideBarState$ = new BehaviorSubject('hidden');

  appNavButtonTemplateRef$ = new BehaviorSubject<TemplateRef<any> | null>(null);
  appNavMenuButtonsTemplateRef$ = new BehaviorSubject<TemplateRef<any> | null>(null);
  appNavSelectedLabelTemplateRef$ = new BehaviorSubject<TemplateRef<any> | null>(null);

  appSideBarItemsTitleTemplateRef$ = new BehaviorSubject<TemplateRef<any> | null>(null);
  appSideBarItemsContainerTemplateRef$ = new BehaviorSubject<TemplateRef<any> | null>(null);
  appSideBarPhoneItemsTitleTemplateRef$ = new BehaviorSubject<TemplateRef<any> | null>(null);
  appSideBarPhoneItemsContainerTemplateRef$ = new BehaviorSubject<TemplateRef<any> | null>(null);

  constructor(
    @Inject(UnauthorizedView) readonly unauthorizedView = '',
    @Inject(AvailableUserViews) readonly availableUserViews = [''],
    @Inject(DefaultUserView) readonly defaultUserView = '',
    private readonly _layoutService: LayoutService
  ) {

    combineLatest([
      this.showSideBar$,
      this._layoutService.isOnDesktop$,
      this._layoutService.isOnTablet$,
    ]).subscribe(([showSideBar, isOnDesktop, isOnTablet]) => {

      let state = 'hidden';

      if (showSideBar) {
        if (isOnDesktop) {
          state = 'desktop';
        } else if (isOnTablet) {
          state = 'tablet';
        }
      }

      this.moveForSideBarState$.next(state);
    });
  }

  select(id: string) {
    this.selected$.next(cloneDeep(this.list$.value?.find((item) => item.id === id)));
  }
}
