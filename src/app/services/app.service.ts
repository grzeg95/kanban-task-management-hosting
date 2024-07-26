import {effect, Injectable} from '@angular/core';
import {Sig} from '../utils/Sig';
import {LayoutService} from './layout.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  showNavMenuOptionsSig = new Sig(false);
  showSideBarSig = new Sig(true);
  showSideBar = this.showSideBarSig.get();
  moveForSideBarStateSig = new Sig('hidden');

  isOnDesktop = this._layoutService.isOnDesktopSig.get();
  isOnTablet = this._layoutService.isOnTabletSig.get();

  constructor(
    private readonly _layoutService: LayoutService
  ) {

    effect(() => {

      const showSideBar = this.showSideBar();
      const isOnDesktop = this.isOnDesktop();
      const isOnTablet = this.isOnTablet();

      let state = 'hidden';

      if (showSideBar) {
        if (isOnDesktop) {
          state = 'desktop';
        } else if (isOnTablet) {
          state = 'tablet';
        }
      }

      this.moveForSideBarStateSig.set(state);
    });
  }
}
