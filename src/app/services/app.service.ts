import {computed, Inject, Injectable, signal, TemplateRef} from '@angular/core';
import {AvailableUserViews, DefaultUserView, UnauthorizedView} from '../tokens/view';
import {LayoutService} from './layout.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  readonly showSideBar = signal<boolean>(false);

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

  constructor(
    @Inject(UnauthorizedView) readonly unauthorizedView = '',
    @Inject(AvailableUserViews) readonly availableUserViews = [''],
    @Inject(DefaultUserView) readonly defaultUserView = '',
    private readonly _layoutService: LayoutService
  ) {
  }
}
