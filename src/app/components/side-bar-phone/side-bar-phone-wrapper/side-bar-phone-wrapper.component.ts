import {Component, Input, TemplateRef} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
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
      <app-side-bar-phone
        [appSideBarPhoneItemsTitleTemplateRef]="appSideBarPhoneItemsTitleTemplateRef"
        [appSideBarPhoneItemsContainerTemplateRef]="appSideBarPhoneItemsContainerTemplateRef"
      />
    }
  `
})
export class SideBarPhoneWrapperComponent {

  protected isOnPhone = toSignal(this._layoutService.isOnPhone$);
  protected showSideBar = toSignal(this._appService.showSideBar$);

  @Input() appSideBarPhoneItemsTitleTemplateRef: TemplateRef<any> | undefined;
  @Input() appSideBarPhoneItemsContainerTemplateRef: TemplateRef<any> | undefined;

  constructor(
    private readonly _layoutService: LayoutService,
    private readonly _appService: AppService
  ) {
  }
}
