import {animate, state, style, transition, trigger} from '@angular/animations';
import {DOCUMENT, NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  Inject,
  Input,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SvgDirective} from '../../directives/svg.directive';
import {AppService} from '../../services/app.service';
import {LayoutService} from '../../services/layout.service';
import {ThemeSelectorService} from '../../services/theme-selector.service';
import {handleTabIndex} from '../../utils/handle-tabindex';
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

  @ViewChild('hideSideBarButton', {read: ElementRef}) hideSideBarButton!: ElementRef;
  @ViewChild('showSideBarButton', {read: ElementRef}) showSideBarButton!: ElementRef;

  @Input() appSideBarItemsTitleTemplateRef: TemplateRef<any> | undefined;
  @Input() appSideBarItemsContainerTemplateRef: TemplateRef<any> | undefined;

  protected showSideBar = this._appService.showSideBar;

  protected isOnPhone = this._layoutService.isOnPhone.get();
  protected isOnTablet = this._layoutService.isOnTablet.get();
  protected isOnDesktop = this._layoutService.isOnDesktop.get();

  protected moveForSideBarState = computed(() => {

    const showSideBar = this.showSideBar.get()();

    if (!showSideBar) {

      if (this.isOnDesktop()) {
        return states.hiddenDesktop;
      }

      return states.hiddenTablet;
    } else {
      if (this.isOnPhone()) {
        return states.hiddenTablet;
      }

      return states.visible;
    }
  });

  protected moveShowSideBarButtonForSideBarState = computed(() => {

    const showSideBar = this.showSideBar.get()();

    if (!showSideBar) {

      if (this.isOnDesktop()) {
        return states.visible;
      }

      if (this.isOnTablet()) {
        return states.visible;
      }

      return states.hidden;
    } else {

      if (this.isOnDesktop()) {
        return states.hiddenDesktop;
      }

      if (this.isOnTablet()) {
        return states.hiddenTablet;
      }

      return states.hidden;
    }
  });

  protected isDark = this._themeSelectorService.isDark.get();
  protected logo = computed(() => this.isDark() ? 'logo-light' : 'logo-dark');

  protected tabIndex = computed(() => {

    const isOnPhone = this.isOnPhone();
    const showSideBar = this.showSideBar.get()();

    if (isOnPhone && showSideBar || !showSideBar) {
      return -1;
    }

    return 0;
  });

  protected tabIndexShowSidebar = computed(() => {

    const isOnPhone = this.isOnPhone();
    const showSideBar = this.showSideBar.get()();

    if (isOnPhone || showSideBar) {
      return -1;
    }

    return 0;
  });

  constructor(
    @Inject(DOCUMENT) private readonly _document: Document,
    private readonly _appService: AppService,
    private readonly _layoutService: LayoutService,
    private readonly _themeSelectorService: ThemeSelectorService
  ) {
  }

  setShowSideBar($event: KeyboardEvent | MouseEvent, value: boolean) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._appService.showSideBar.set(value);

    switch (this._document.activeElement) {
      case this.hideSideBarButton.nativeElement:
        this.showSideBarButton.nativeElement.focus();
        break;
      case this.showSideBarButton.nativeElement:
        this.hideSideBarButton.nativeElement.focus();
        break;
    }
  }

  toggleDarkMode() {
    if (this.isDark()) {
      this._themeSelectorService.setLight();
    } else {
      this._themeSelectorService.setDark();
    }
  }
}
