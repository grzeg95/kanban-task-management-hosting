import {effect, Injectable} from '@angular/core';
import {Sig} from '../utils/Sig';
import {LayoutService} from './layout.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  readonly showNavMenuOptionsSig = new Sig(false);
  readonly showSideBarSig = new Sig(true);
  private readonly _showSideBar = this.showSideBarSig.get();
  readonly moveForSideBarStateSig = new Sig('hidden');

  private readonly _isOnDesktop = this._layoutService.isOnDesktopSig.get();
  private readonly _isOnTablet = this._layoutService.isOnTabletSig.get();

  constructor(
    private readonly _layoutService: LayoutService
  ) {

    effect(() => {

      const showSideBar = this._showSideBar();
      const isOnDesktop = this._isOnDesktop();
      const isOnTablet = this._isOnTablet();

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
