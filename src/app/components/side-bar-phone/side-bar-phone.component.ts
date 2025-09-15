import {animate, animation, style, transition, trigger} from '@angular/animations';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, Input, TemplateRef, ViewEncapsulation} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SvgDirective} from '../../directives/svg.directive';
import {LayoutService} from '../../services/layout.service';
import {ThemeSelectorService} from '../../services/theme-selector.service';
import {SwitchComponent} from '../form/switch/switch.component';

const closedStyles = style({
  opacity: 0
});

const openedStyles = style({
  opacity: '*'
});

const animateTiming = '0.333s ease-in-out';

@Component({
  selector: 'app-side-bar-phone',
  imports: [
    SvgDirective,
    SwitchComponent,
    FormsModule,
    NgTemplateOutlet,
    AsyncPipe
  ],
  templateUrl: './side-bar-phone.component.html',
  styleUrl: './side-bar-phone.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-side-bar-phone',
    '[@host]': ''
  },
  animations: [
    trigger('host', [
      transition(
        ':enter',
        animation([closedStyles, animate(animateTiming, openedStyles)]),
      ),
      transition(
        ':leave',
        animation([openedStyles, animate(animateTiming, closedStyles)])
      ),
    ])
  ]
})
export class SideBarPhoneComponent {

  private readonly _layoutService = inject(LayoutService);
  private readonly _themeSelectorService = inject(ThemeSelectorService);

  @Input() appSideBarPhoneItemsTitleTemplateRef: TemplateRef<any> | undefined;
  @Input() appSideBarPhoneItemsContainerTemplateRef: TemplateRef<any> | undefined;

  protected readonly _darkMode$ = this._themeSelectorService.darkMode$;

  toggleDarkMode() {
    if (this._darkMode$.value) {
      this._themeSelectorService.setLight();
    } else {
      this._themeSelectorService.setDark();
    }
  }

  setShowSideBar(value: boolean) {
    this._layoutService.showSideBar$.next(value);
  }
}
