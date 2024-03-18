import {computed, Inject, Injectable, signal, TemplateRef} from '@angular/core';
import {MainListItem} from '../models/main-list-item';
import {AvailableUserViews, DefaultUserView, UnauthorizedView} from '../tokens/view';
import {LayoutService} from './layout.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  readonly list = signal<MainListItem[] | null | undefined>(undefined)
  readonly selected = signal<MainListItem | null | undefined>(undefined);
  readonly showSideBar = signal<boolean>(true);

  readonly moveForSideBarState = computed(() => {

    const showSideBar = this.showSideBar();

    if (showSideBar) {
      if (this._layoutService.isOnDesktop()) {
        return 'desktop';
      } else if (this._layoutService.isOnTablet()) {
        return 'tablet';
      }
    }

    return 'hidden';
  });

  readonly appNavButtonTemplateRef = signal<TemplateRef<any> | null>(null);
  readonly appNavMenuButtonsTemplateRef = signal<TemplateRef<any> | null>(null);
  readonly appNavSelectedLabelTemplateRef = signal<TemplateRef<any> | null>(null);

  readonly appSideBarItemsTitleTemplateRef = signal<TemplateRef<any> | null>(null);
  readonly appSideBarItemsContainerTemplateRef = signal<TemplateRef<any> | null>(null);
  readonly appSideBarPhoneItemsTitleTemplateRef = signal<TemplateRef<any> | null>(null);
  readonly appSideBarPhoneItemsContainerTemplateRef = signal<TemplateRef<any> | null>(null);

  constructor(
    @Inject(UnauthorizedView) readonly unauthorizedView = '',
    @Inject(AvailableUserViews) readonly availableUserViews = [''],
    @Inject(DefaultUserView) readonly defaultUserView = '',
    private readonly _layoutService: LayoutService
  ) {
  }

  select(id: string) {
    this.selected.set(this.list()?.find((item) => item.id === id));
  }
}
