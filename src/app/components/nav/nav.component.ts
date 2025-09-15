import {animate, state, style, transition, trigger} from '@angular/animations';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, Input, TemplateRef, ViewEncapsulation} from '@angular/core';
import {combineLatest, map} from 'rxjs';
import {SvgDirective} from '../../directives/svg.directive';
import {AuthService} from '../../services/auth.service';
import {LayoutService, LayoutServiceStates} from '../../services/layout.service';
import {LoadingService} from '../../services/loading.service';
import {ThemeSelectorService} from '../../services/theme-selector.service';
import {handleTabIndex} from '../../utils/handle-tabindex';
import {ButtonSize} from '../button/button.component';
import {LoadingComponent} from '../loading/loading.component';
import {PopMenuComponent} from '../pop-menu/pop-menu.component';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
    PopMenuComponent,
    SvgDirective,
    LoadingComponent,
    AsyncPipe
  ],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-nav'
  },
  animations: [
    trigger(
      'move-branding-for-side-bar',
      [
        state(
          LayoutServiceStates.hidden,
          style({
            width: 0
          })
        ),
        state(
          LayoutServiceStates.tablet,
          style({
            width: 212
          })
        ),
        state(
          LayoutServiceStates.desktop,
          style({
            width: 242
          })
        ),
        transition(
          `${LayoutServiceStates.tablet} <=> ${LayoutServiceStates.hidden}, ${LayoutServiceStates.desktop} <=> ${LayoutServiceStates.hidden}`,
          animate('0.333s ease-in-out')
        )
      ]
    )
  ]
})
export class NavComponent {

  @Input() appNavButtonTemplateRef: TemplateRef<any> | undefined;
  @Input() appNavMenuButtonsTemplateRef: TemplateRef<any> | undefined;
  @Input() appNavSelectedLabelTemplateRef: TemplateRef<any> | undefined;

  private readonly _firstAnimation$ = this._layoutService.firstAnimation$;

  protected readonly _showNavMenuOptions$ = this._layoutService.showNavMenuOptions$;
  protected readonly _darkMode$ = this._themeSelectorService.darkMode$;
  protected readonly _isLoggedIn$ = this._authService.isLoggedIn$;
  protected readonly _authStateReady$ = this._authService.authStateReady$;
  protected readonly _isOnDesktop$ = this._layoutService.isOnDesktop$;
  protected readonly _isOnTablet$ = this._layoutService.isOnTablet$;
  protected readonly _isOnPhone$ = this._layoutService.isOnPhone$;
  protected readonly _showSideBar$ = this._layoutService.showSideBar$;

  protected get _showSideBar() {
    return this._showSideBar$.value;
  }

  protected get _showNavMenuOptions() {
    return this._showNavMenuOptions$.value;
  }

  protected readonly _moveBrandingForSideBarState$ = combineLatest([
    this._firstAnimation$,
    this._showSideBar$,
    this._isOnDesktop$,
    this._isOnTablet$
  ]).pipe(
    map(([
      firstAnimation,
      showSideBar,
      isOnDesktop,
      isOnTablet
    ]) => {

      let state = 'hidden';

      if (showSideBar) {
        if (isOnDesktop) {
          state = LayoutServiceStates.desktop;
        } else if (isOnTablet) {
          state = LayoutServiceStates.tablet;
        }
      }

      if (firstAnimation) {
        state += '-first';
      }

      return state;
    })
  );

  protected readonly _appLoading$ = this._loadingService.appLoading$;

  protected readonly _logo$ = combineLatest([
    this._isOnTablet$,
    this._isOnDesktop$,
    this._darkMode$
  ]).pipe(
    map(([
      isOnTablet,
      isOnDesktop,
      darkMode
    ]) => {

      if (isOnTablet || isOnDesktop) {
        if (darkMode) {
          return 'logo-light';
        }
        return 'logo-dark';
      }

      return 'logo';
    })
  );

  protected readonly _loginButtonSize$ = combineLatest([
    this._isOnPhone$
  ]).pipe(
    map(([
      isOnPhone
    ]) => {

      let buttonSize: ButtonSize = 'large';

      if (isOnPhone) {
        buttonSize = 'small';
      }

      return buttonSize;
    })
  );

  constructor(
    private readonly _themeSelectorService: ThemeSelectorService,
    private readonly _authService: AuthService,
    private readonly _layoutService: LayoutService,
    private readonly _loadingService: LoadingService
  ) {
  }

  setShowSideBar($event: KeyboardEvent | MouseEvent, value: boolean) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    if ($event instanceof KeyboardEvent) {
      if ($event.code !== 'Space' && $event.code !== 'Enter') {
        return;
      }
    }

    this._layoutService.showSideBar$.next(value);
  }

  setShowNavMenuOptions($event: KeyboardEvent | MouseEvent, value: boolean) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    if ($event instanceof KeyboardEvent) {
      if ($event.code !== 'Space' && $event.code !== 'Enter') {
        return;
      }
    }

    this._layoutService.showNavMenuOptions$.next(value);
  }
}
