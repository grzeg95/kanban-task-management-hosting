import {BreakpointObserver} from '@angular/cdk/layout';
import {inject, Injectable} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {BehaviorSubject, combineLatest} from 'rxjs';
import {Breakpoints, BreakpointsDevices} from '../models/breakpoints';

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

  private readonly _breakpointObserver = inject(BreakpointObserver);

  private readonly _displayNameMap = new Map([
    [Breakpoints.phone.selector, BreakpointsDevices.phone],
    [Breakpoints.tablet.selector, BreakpointsDevices.tablet],
    [Breakpoints.desktop.selector, BreakpointsDevices.desktop]
  ]);

  readonly firstAnimation$ = new BehaviorSubject(true);

  readonly isOnPhone$ = new BehaviorSubject(false);

  readonly isOnTablet$ = new BehaviorSubject(false);

  readonly isOnDesktop$ = new BehaviorSubject(false);

  readonly heightNav$ = new BehaviorSubject(0);

  readonly showNavMenuOptions$ = new BehaviorSubject(false);
  readonly showSideBar$ = new BehaviorSubject(false);
  readonly moveForSideBarState$ = new BehaviorSubject('hidden-first');

  constructor() {

    combineLatest([
      this.isOnPhone$,
      this.isOnTablet$,
      this.isOnDesktop$
    ]).subscribe(([isOnPhone, isOnTablet, isOnDesktop]) => {
      let height = 0;

      if (isOnPhone) {
        height = 64;
      }

      if (isOnTablet) {
        height = 81;
      }

      if (isOnDesktop) {
        height = 97;
      }

      this.heightNav$.next(height);
    });

    combineLatest([
      this.firstAnimation$,
      this.showSideBar$,
      this.isOnTablet$,
      this.isOnDesktop$
    ]).subscribe(([firstAnimation, showSideBar, isOnTablet, isOnDesktop]) => {

      let state = LayoutServiceStates.hidden;

      if (showSideBar) {
        if (isOnDesktop) {
          state = LayoutServiceStates.desktop;
        } else if (isOnTablet) {
          state = LayoutServiceStates.tablet;
        }
      }

      if (firstAnimation) {
        this.firstAnimation$.next(false);
        state = LayoutServiceStates.first;
      }

      this.moveForSideBarState$.next(state);
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

          this.isOnPhone$.next(false);
          this.isOnTablet$.next(false);
          this.isOnDesktop$.next(false);

          if (breakpointsDevice === BreakpointsDevices.phone) {
            this.isOnPhone$.next(true);
          }

          if (breakpointsDevice === BreakpointsDevices.tablet) {
            this.isOnTablet$.next(true);
          }

          if (breakpointsDevice === BreakpointsDevices.desktop) {
            this.isOnDesktop$.next(true);
          }
        }
      }
    });
  }
}
