import {animate, state, style, transition, trigger} from '@angular/animations';
import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, ViewEncapsulation} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SvgDirective} from '../../directives/svg.directive';
import {AppService} from '../../services/app.service';
import {LayoutService} from '../../services/layout.service';
import {ThemeSelectorService} from '../../services/theme-selector.service';
import {ButtonComponent} from '../button/button.component';
import {SwitchComponent} from '../form/switch/switch.component';

enum states {
  hidden = 'hidden',
  hiddenTablet = 'hidden-tablet',
  hiddenDesktop = 'hidden-desktop',
  visible = 'visible'
}

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [
    SvgDirective,
    NgTemplateOutlet,
    SwitchComponent,
    FormsModule,
    ButtonComponent
  ],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-side-bar'
  },
  animations: [
    trigger(
      'moveForSideBarState',
      [
        state(states.hiddenTablet,
          style({
            left: -261
          })
        ),
        state(states.hiddenDesktop,
          style({
            left: -300
          })
        ),
        state(states.visible,
          style({
            left: 0
          })
        ),
        transition(
          `${states.hiddenTablet} <=> ${states.visible}, ${states.hiddenDesktop} <=> ${states.visible}`,
          animate('0.333s ease-in-out')
        )
      ],
    ),
    trigger(
      'moveShowSideBarButtonForSideBarState',
      [
        state(states.hiddenTablet,
          style({
            left: 200
          })
        ),
        state(states.hiddenDesktop,
          style({
            left: 239
          })
        ),
        state(states.visible,
          style({
            left: -20
          })
        ),
        state(states.hidden,
          style({
            left: -61
          })
        ),
        transition(
          `${states.hidden} <=> ${states.hiddenTablet}, ${states.hiddenTablet} <=> ${states.visible}, ${states.hiddenDesktop} <=> ${states.visible}`,
          animate('0.333s ease-in-out')
        )
      ]
    )
  ]
})
export class SideBarComponent {

  appSideBarItemsTitleTemplateRef = this._appService.appSideBarItemsTitleTemplateRef;
  appSideBarItemsContainerTemplateRef = this._appService.appSideBarItemsContainerTemplateRef;

  moveForSideBarState = computed(() => {

    const showSideBar = this._appService.showSideBar();

    if (!showSideBar) {

      if (this._layoutService.isOnDesktop()) {
        return states.hiddenDesktop;
      }

      return states.hiddenTablet;
    } else {
      if (this._layoutService.isOnPhone()) {
        return states.hiddenTablet;
      }

      return states.visible;
    }
  });

  moveShowSideBarButtonForSideBarState = computed(() => {

    const showSideBar = this._appService.showSideBar();

    if (!showSideBar) {

      if (this._layoutService.isOnDesktop()) {
        return states.visible;
      }

      if (this._layoutService.isOnTablet()) {
        return states.visible;
      }

      return states.hidden;
    } else {

      if (this._layoutService.isOnDesktop()) {
        return states.hiddenDesktop;
      }

      if (this._layoutService.isOnTablet()) {
        return states.hiddenTablet;
      }

      return states.hidden;
    }
  });

  isDark = this._themeSelectorService.isDark;
  logo = computed(() => this.isDark() ? 'logo-light' : 'logo-dark');

  constructor(
    private readonly _appService: AppService,
    private readonly _layoutService: LayoutService,
    private readonly _themeSelectorService: ThemeSelectorService
  ) {
  }

  hideSideBar() {
    this._appService.showSideBar.set(false);
  }

  showSideBar() {
    this._appService.showSideBar.set(true);
  }

  toggleDarkMode() {
    if (this.isDark()) {
      this._themeSelectorService.setLight();
    } else {
      this._themeSelectorService.setDark();
    }
  }
}
