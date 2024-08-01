import {BreakpointObserver} from '@angular/cdk/layout';
import {effect, Injectable} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Breakpoints, BreakpointsDevices} from '../models/breakpoints';
import {Sig} from '../utils/Sig';

export enum LayoutServiceStates {
  first = 'first',
  hidden = 'hidden',
  phone = 'phone',
  tablet = 'tablet',
  desktop = 'desktop'
}

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  private readonly _displayNameMap = new Map([
    [Breakpoints.phone.selector, BreakpointsDevices.phone],
    [Breakpoints.tablet.selector, BreakpointsDevices.tablet],
    [Breakpoints.desktop.selector, BreakpointsDevices.desktop]
  ]);

  readonly firstAnimation = new Sig(true);
  private readonly _firstAnimation = this.firstAnimation.get();

  readonly isOnPhoneSig = new Sig(false);
  private readonly _isOnPhone = this.isOnPhoneSig.get();

  readonly isOnTabletSig = new Sig(false);
  private readonly _isOnTablet = this.isOnTabletSig.get();

  readonly isOnDesktopSig = new Sig(false);
  private readonly _isOnDesktop = this.isOnDesktopSig.get();

  readonly heightNavSig = new Sig(0);

  readonly showNavMenuOptionsSig = new Sig(false);
  readonly showSideBarSig = new Sig(true);
  private readonly _showSideBar = this.showSideBarSig.get();
  readonly moveForSideBarStateSig = new Sig('hidden-first');

  constructor(
    private _breakpointObserver: BreakpointObserver
  ) {

    effect(() => {

      const isOnPhone = this._isOnPhone();
      const isOnTablet = this._isOnTablet();
      const isOnDesktop = this._isOnDesktop();

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

      this.heightNavSig.set(height);
    });

    effect(() => {

      const firstAnimation = this._firstAnimation();

      const showSideBar = this._showSideBar();
      const isOnDesktop = this._isOnDesktop();
      const isOnTablet = this._isOnTablet();

      let state = LayoutServiceStates.hidden;

      if (showSideBar) {
        if (isOnDesktop) {
          state = LayoutServiceStates.desktop;
        } else if (isOnTablet) {
          state = LayoutServiceStates.tablet;
        }
      }

      if (firstAnimation) {
        this.firstAnimation.set(false);
        state = LayoutServiceStates.first;
      }

      this.moveForSideBarStateSig.set(state);
    });

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

          this.isOnPhoneSig.set(false);
          this.isOnTabletSig.set(false);
          this.isOnDesktopSig.set(false);

          if (breakpointsDevice === BreakpointsDevices.phone) {
            this.isOnPhoneSig.set(true);
          }

          if (breakpointsDevice === BreakpointsDevices.tablet) {
            this.isOnTabletSig.set(true);
          }

          if (breakpointsDevice === BreakpointsDevices.desktop) {
            this.isOnDesktopSig.set(true);
          }
        }
      }
    });
  }
}
