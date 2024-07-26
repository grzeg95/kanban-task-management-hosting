import {animate, animation, style, transition, trigger} from '@angular/animations';
import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, Input, TemplateRef, ViewEncapsulation} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SvgDirective} from '../../directives/svg.directive';
import {AppService} from '../../services/app.service';
import {ThemeSelectorService} from '../../services/theme-selector.service';
import {ButtonComponent} from '../button/button.component';
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
  standalone: true,
  imports: [
    ButtonComponent,
    SvgDirective,
    SwitchComponent,
    FormsModule,
    NgTemplateOutlet
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

  @Input() appSideBarPhoneItemsTitleTemplateRef: TemplateRef<any> | undefined;
  @Input() appSideBarPhoneItemsContainerTemplateRef: TemplateRef<any> | undefined;

  protected isDark = this._themeSelectorService.isDarkSig.get();

  constructor(
    private readonly _appService: AppService,
    private readonly _themeSelectorService: ThemeSelectorService
  ) {
  }

  toggleDarkMode() {
    if (this.isDark()) {
      this._themeSelectorService.setLight();
    } else {
      this._themeSelectorService.setDark();
    }
  }

  setShowSideBar(value: boolean) {
    this._appService.showSideBarSig.set(value);
  }
}
