import {ChangeDetectionStrategy, Component, HostBinding, Input, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'app-pop-menu-item',
  imports: [],
  templateUrl: './pop-menu-item.component.html',
  styleUrl: './pop-menu-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-pop-menu-item'
  }
})
export class PopMenuItemComponent {

  @Input() @HostBinding('class.app-pop-menu-item--danger') danger = false;
}
