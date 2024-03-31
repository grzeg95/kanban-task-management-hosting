import {animate, state, style, transition, trigger} from '@angular/animations';
import {NgStyle} from '@angular/common';
import {Component, Signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterOutlet} from '@angular/router';
import {NavComponent} from './components/nav/nav.component';
import {
  SideBarPhoneWrapperComponent
} from './components/side-bar-phone/side-bar-phone-wrapper/side-bar-phone-wrapper.component';
import {SideBarComponent} from './components/side-bar/side-bar.component';
import {AppService} from './services/app.service';
import {LayoutService} from './services/layout.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SideBarComponent,
    SideBarPhoneWrapperComponent,
    RouterOutlet,
    NavComponent,
    NgStyle
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger(
      'moveRouterOutletForSideBar',
      [
        state(
          'hidden',
          style({
            marginLeft: 0
          })
        ),
        state(
          'tablet',
          style({
            marginLeft: 261
          })
        ),
        state(
          'desktop',
          style({
            marginLeft: 300
          })
        ),
        transition(
          '* => hidden, hidden => phone, hidden => tablet, hidden => desktop',
          animate('0.333s ease-in-out'),
        )
      ]
    )
  ]
})
export class AppComponent {

  moveRouterOutletForSideBar = toSignal(this._appService.moveForSideBarState$);
  heightNav = toSignal(this._layoutService.heightNav$);

  constructor(
    private readonly _appService: AppService,
    private readonly _layoutService: LayoutService
  ) {
  }
}
