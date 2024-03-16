import {BreakpointObserver} from '@angular/cdk/layout';
import {computed, Injectable, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
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

  private readonly _currentScreenBreakpoint = signal<BreakpointsDevices | undefined>(undefined);

  readonly isOnDesktop = computed(() => this._currentScreenBreakpoint() === BreakpointsDevices.desktop);
  readonly isOnTablet = computed(() => this._currentScreenBreakpoint() === BreakpointsDevices.tablet);
  readonly isOnPhone = computed(() => this._currentScreenBreakpoint() === BreakpointsDevices.phone);

  constructor(
    private _breakpointObserver: BreakpointObserver
  ) {
    this._breakpointObserver
      .observe([
        Breakpoints.phone.selector,
        Breakpoints.tablet.selector,
        Breakpoints.desktop.selector
      ])
      .pipe(takeUntilDestroyed())
      .subscribe((result) => {

        for (const query of Object.keys(result.breakpoints)) {
          if (result.breakpoints[query]) {
            this._currentScreenBreakpoint.set(this._displayNameMap.get(query));
          }
        }
      });
  }
}
