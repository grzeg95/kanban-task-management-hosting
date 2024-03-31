import {BreakpointObserver} from '@angular/cdk/layout';
import {Injectable} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {BehaviorSubject, combineLatest} from 'rxjs';
import {Breakpoints, BreakpointsDevices} from '../models/breakpoints';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  private readonly _displayNameMap = new Map([
    [Breakpoints.phone.selector, BreakpointsDevices.phone],
    [Breakpoints.tablet.selector, BreakpointsDevices.tablet],
    [Breakpoints.desktop.selector, BreakpointsDevices.desktop]
  ]);

  readonly isOnPhone$ = new BehaviorSubject(false);
  readonly isOnTablet$ = new BehaviorSubject(false);
  readonly isOnDesktop$ = new BehaviorSubject(false);

  readonly heightNav$ = new BehaviorSubject(0);

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

    combineLatest([
      this.isOnPhone$,
      this.isOnTablet$,
      this.isOnDesktop$
    ]).pipe(
      takeUntilDestroyed()
    ).subscribe(([isOnPhone, isOnTablet, isOnDesktop]) => {

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

      this.heightNav$.next(height);
    });
  }
}
