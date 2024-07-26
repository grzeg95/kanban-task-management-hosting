import {animate, state, style, transition, trigger} from '@angular/animations';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, Input, TemplateRef, ViewEncapsulation} from '@angular/core';
import {Router} from '@angular/router';
import {SvgDirective} from '../../directives/svg.directive';
import {AppService} from '../../services/app.service';
import {AuthService} from '../../services/auth/auth.service';
import {LayoutService} from '../../services/layout.service';
import {ThemeSelectorService} from '../../services/theme-selector.service';
import {handleTabIndex} from '../../utils/handle-tabindex';
import {ButtonComponent} from '../button/button.component';
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
    SvgDirective
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
          'hidden',
          style({
            width: 0
          })
        ),
        state(
          'tablet',
          style({
            width: 261
          })
        ),
        state(
          'desktop',
          style({
            width: 300
          })
        ),
        transition(
          '* => hidden, hidden => phone, hidden => tablet, hidden => desktop',
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

  protected readonly _showNavMenuOptions = this._appService.showNavMenuOptionsSig.get();
  protected readonly _isDark = this._themeSelectorService.isDarkSig.get();
  protected readonly _isLoggedIn = this._authService.isLoggedIn;
  protected readonly _authStateReady = this._authService.authStateReady;
  protected readonly _isOnDesktop = this._layoutService.isOnDesktopSig.get();
  protected readonly _isOnTablet = this._layoutService.isOnTabletSig.get();
  protected readonly _isOnPhone = this._layoutService.isOnPhoneSig.get();
  protected readonly _moveBrandingForSideBarState = this._appService.moveForSideBarStateSig.get();
  protected readonly _showSideBar = this._appService.showSideBarSig.get();

  constructor(
    private readonly _themeSelectorService: ThemeSelectorService,
    private readonly _authService: AuthService,
    private readonly _appService: AppService,
    private readonly _layoutService: LayoutService,
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

    this._appService.showSideBarSig.set(value);
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

    this._appService.showNavMenuOptionsSig.set(value);
  }
}
