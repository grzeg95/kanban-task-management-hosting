import {animate, state, style, transition, trigger} from '@angular/animations';
import {AsyncPipe, DOCUMENT, NgTemplateOutlet} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Input,
  TemplateRef,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {combineLatest, map} from 'rxjs';
import {SvgDirective} from '../../directives/svg.directive';
import {LayoutService} from '../../services/layout.service';
import {LoadingService} from '../../services/loading.service';
import {ThemeSelectorService} from '../../services/theme-selector.service';
import {handleTabIndex} from '../../utils/handle-tabindex';
import {ButtonComponent} from '../button/button.component';
import {SwitchComponent} from '../form/switch/switch.component';
import {LoadingComponent} from '../loading/loading.component';

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
    ButtonComponent,
    LoadingComponent,
    AsyncPipe
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

  protected readonly _showSideBar$ = this._layoutService.showSideBar$;

  protected readonly _isOnPhone$ = this._layoutService.isOnPhone$;
  protected readonly _isOnTablet$ = this._layoutService.isOnTablet$;
  protected readonly _isOnDesktop$ = this._layoutService.isOnDesktop$;

  protected readonly _appLoading$ = this._loadingService.appLoading$;

  protected readonly _moveForSideBarState$ = combineLatest([
    this._showSideBar$,
    this._isOnDesktop$,
    this._isOnPhone$
  ]).pipe(
    map(([
      showSideBar,
      isOnDesktop,
      isOnPhone
    ]) => {
      if (!showSideBar) {

        if (isOnDesktop) {
          return states.hiddenDesktop;
        }

        return states.hiddenTablet;

      } else {
        if (isOnPhone) {
          return states.hiddenTablet;
        }

        return states.visible;
      }
    })
  );

  protected readonly _moveShowSideBarButtonForSideBarState$ = combineLatest([
    this._showSideBar$,
    this._isOnDesktop$,
    this._isOnTablet$,
  ]).pipe(
    map(([
      showSideBar,
      isOnDesktop,
      isOnTablet
    ]) => {

      if (!showSideBar) {

        if (isOnDesktop) {
          return states.visible;
        }

        if (isOnTablet) {
          return states.visible;
        }

        return states.hidden;
      } else {

        if (isOnDesktop) {
          return states.hiddenDesktop;
        }

        if (isOnTablet) {
          return states.hiddenTablet;
        }

        return states.hidden;
      }
    })
  );

  protected readonly _darkMode$ = this._themeSelectorService.darkMode$;
  protected readonly _logo$ = combineLatest([
    this._darkMode$
  ]).pipe(
    map(([
      darkMode
    ]) => {
      return darkMode ? 'logo-light' : 'logo-dark'
    })
  );

  protected readonly _tabIndex$ = combineLatest([
    this._isOnPhone$,
    this._showSideBar$
  ]).pipe(
    map(([
      isOnPhone,
      showSideBar
    ]) => {

      if (isOnPhone && showSideBar || !showSideBar) {
        return -1;
      }

      return 0;
    })
  );

  protected readonly _tabIndexShowSidebar$ = combineLatest([
    this._isOnPhone$,
    this._showSideBar$
  ]).pipe(
    map(([
      isOnPhone,
      showSideBar
    ]) => {

      if (isOnPhone || showSideBar) {
        return -1;
      }

      return 0;
    })
  );

  constructor(
    @Inject(DOCUMENT)
    private readonly _document: Document,
    private readonly _layoutService: LayoutService,
    private readonly _themeSelectorService: ThemeSelectorService,
    private readonly _loadingService: LoadingService
  ) {
  }

  setShowSideBar($event: KeyboardEvent | MouseEvent, value: boolean) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this._layoutService.showSideBar$.next(value);

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
    if (this._darkMode$.value) {
      this._themeSelectorService.setLight();
    } else {
      this._themeSelectorService.setDark();
    }
  }
}
