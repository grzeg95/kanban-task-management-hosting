import {Component} from '@angular/core';
import {AppService} from '../../../services/app.service';
import {LayoutService} from '../../../services/layout.service';
import {SideBarPhoneComponent} from '../side-bar-phone.component';

@Component({
  selector: 'app-side-bar-phone-wrapper',
  standalone: true,
  imports: [
    SideBarPhoneComponent
  ],
  template: `
    @if (isOnPhone() && showSideBar()) {
      <app-side-bar-phone/>
    }
  `
})
export class SideBarPhoneWrapperComponent {

  isOnPhone = this._layoutService.isOnPhone;
  showSideBar = this._appService.showSideBar;

  constructor(
    private readonly _layoutService: LayoutService,
    private readonly _appService: AppService
  ) {
  }
}
