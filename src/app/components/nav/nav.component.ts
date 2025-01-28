import {animate, state, style, transition, trigger} from '@angular/animations';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, Input, TemplateRef, ViewEncapsulation} from '@angular/core';
import {Router} from '@angular/router';
import {SvgDirective} from '../../directives/svg.directive';
import {AuthService} from '../../services/auth.service';
import {LayoutService, LayoutServiceStates} from '../../services/layout.service';
import {LoadingService} from '../../services/loading.service';
import {ThemeSelectorService} from '../../services/theme-selector.service';
import {handleTabIndex} from '../../utils/handle-tabindex';
import {ButtonComponent, ButtonSize} from '../button/button.component';
import {LoadingComponent} from '../loading/loading.component';
import {PopMenuItemComponent} from '../pop-menu/pop-menu-item/pop-menu-item.component';
import {PopMenuComponent} from '../pop-menu/pop-menu.component';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    CdkOverlayOrigin,
    ButtonComponent,
    CdkConnectedOverlay,
    PopMenuComponent,
    PopMenuItemComponent,
    SvgDirective,
    LoadingComponent
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

  private readonly _firstAnimation = this._layoutService.firstAnimation.get();

  protected readonly _showNavMenuOptions = this._layoutService.showNavMenuOptionsSig.get();
  protected readonly _darkMode = this._themeSelectorService.darkModeSig.get();
  protected readonly _isLoggedIn = this._authService.isLoggedIn;
  protected readonly _authStateReady = this._authService.authStateReady;
  protected readonly _isOnDesktop = this._layoutService.isOnDesktopSig.get();
  protected readonly _isOnTablet = this._layoutService.isOnTabletSig.get();
  protected readonly _isOnPhone = this._layoutService.isOnPhoneSig.get();

  protected readonly _moveBrandingForSideBarState = computed(() => {

    const firstAnimation = this._firstAnimation();

    const showSideBar = this._showSideBar();
    const isOnDesktop = this._isOnDesktop();
    const isOnTablet = this._isOnTablet();

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
  });

  protected readonly _showSideBar = this._layoutService.showSideBarSig.get();

  protected readonly _appLoading = this._loadingService.appLoading;

  protected readonly _logo = computed(() => {

    if (this._isOnTablet() || this._isOnDesktop()) {
      if (this._darkMode()) {
        return 'logo-light';
      }
      return 'logo-dark';
    }

    return 'logo';
  });

  loginButtonSize = computed(() => {

    let buttonSize: ButtonSize = 'large';

    if (this._isOnPhone()) {
      buttonSize = 'small';
    }

    return buttonSize;
  });

  constructor(
    private readonly _themeSelectorService: ThemeSelectorService,
    private readonly _authService: AuthService,
    private readonly _layoutService: LayoutService,
    private readonly _loadingService: LoadingService,
    private readonly _router: Router
  ) {
  }

  signInAnonymously(): Promise<void> {
    this._router.navigate(['/']);
    return this._authService.signInAnonymously();
  }

  signOut(): Promise<void> {
    this._router.navigate(['/']);
    return this._authService.signOut();
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

    this._layoutService.showSideBarSig.set(value);
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

    this._layoutService.showNavMenuOptionsSig.set(value);
  }
}
