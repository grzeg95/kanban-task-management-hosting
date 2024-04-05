import {Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest} from 'rxjs';
import {LayoutService} from './layout.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  showNavMenuOptions$ = new BehaviorSubject<boolean>(false);
  showSideBar$ = new BehaviorSubject<boolean>(true);
  moveForSideBarState$ = new BehaviorSubject('hidden');

  constructor(
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
}
