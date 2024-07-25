import {BreakpointObserver} from '@angular/cdk/layout';
import {effect, Injectable} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Breakpoints, BreakpointsDevices} from '../models/breakpoints';
import {Sig} from '../utils/Sig';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  private readonly _displayNameMap = new Map([
    [Breakpoints.phone.selector, BreakpointsDevices.phone],
    [Breakpoints.tablet.selector, BreakpointsDevices.tablet],
    [Breakpoints.desktop.selector, BreakpointsDevices.desktop]
  ]);

  readonly isOnPhone = new Sig(false);
  readonly isOnTablet = new Sig(false);
  readonly isOnDesktop = new Sig(false);
  readonly heightNav = new Sig(0);

  constructor(
    private _breakpointObserver: BreakpointObserver
  ) {

    this._breakpointObserver.observe([
      Breakpoints.phone.selector,
      Breakpoints.tablet.selector,
      Breakpoints.desktop.selector
    ]).pipe(
      takeUntilDestroyed()
    ).subscribe((result) => {

      for (const query of Object.keys(result.breakpoints)) {
        if (result.breakpoints[query]) {

          const breakpointsDevice = this._displayNameMap.get(query);

          this.isOnPhone.set(false);
          this.isOnTablet.set(false);
          this.isOnDesktop.set(false);

          if (breakpointsDevice === BreakpointsDevices.phone) {
            this.isOnPhone.set(true);
          }

          if (breakpointsDevice === BreakpointsDevices.tablet) {
            this.isOnTablet.set(true);
          }

          if (breakpointsDevice === BreakpointsDevices.desktop) {
            this.isOnDesktop.set(true);
          }
        }
      }

      effect(() => {

        const isOnPhone = this.isOnPhone.get()();
        const isOnTablet = this.isOnTablet.get()();
        const isOnDesktop = this.isOnDesktop.get()();

        let height = 0;

        if (isOnPhone) {
          height = 64;
        }

        if (isOnTablet) {
          height = 80;
        }

        if (isOnDesktop) {
          height = 97;
        }

        this.heightNav.set(height);
      });
    });
  }
}
