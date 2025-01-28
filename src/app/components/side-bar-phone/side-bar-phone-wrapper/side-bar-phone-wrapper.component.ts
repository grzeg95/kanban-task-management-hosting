import {Component, Input, TemplateRef} from '@angular/core';
import {LayoutService} from '../../../services/layout.service';
import {SideBarPhoneComponent} from '../side-bar-phone.component';

@Component({
  selector: 'app-side-bar-phone-wrapper',
  standalone: true,
  imports: [
    SideBarPhoneComponent
  ],
  template: `
    @if (_isOnPhone() && _showSideBar()) {
      <app-side-bar-phone
        [appSideBarPhoneItemsTitleTemplateRef]="appSideBarPhoneItemsTitleTemplateRef"
        [appSideBarPhoneItemsContainerTemplateRef]="appSideBarPhoneItemsContainerTemplateRef"
      />
    }
  `
})
export class SideBarPhoneWrapperComponent {

  protected readonly _isOnPhone = this._layoutService.isOnPhoneSig.get();
  protected readonly _showSideBar = this._layoutService.showSideBarSig.get();

  @Input() appSideBarPhoneItemsTitleTemplateRef: TemplateRef<any> | undefined;
  @Input() appSideBarPhoneItemsContainerTemplateRef: TemplateRef<any> | undefined;

  constructor(
    private readonly _layoutService: LayoutService
  ) {
  }
}
