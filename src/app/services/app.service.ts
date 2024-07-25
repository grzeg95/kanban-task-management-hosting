import {effect, Injectable} from '@angular/core';
import {Sig} from '../utils/Sig';
import {LayoutService} from './layout.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  showNavMenuOptions = new Sig(false);
  showSideBar = new Sig(true);
  moveForSideBarState = new Sig('hidden');

  constructor(
    private readonly _layoutService: LayoutService
  ) {

    effect(() => {

      const showSideBar = this.showSideBar.get()();
      const isOnDesktop = this._layoutService.isOnDesktop.get()();
      const isOnTablet = this._layoutService.isOnTablet.get()();

      let state = 'hidden';

      if (showSideBar) {
        if (isOnDesktop) {
          state = 'desktop';
        } else if (isOnTablet) {
          state = 'tablet';
        }
      }

      this.moveForSideBarState.set(state);
    });
  }
}
