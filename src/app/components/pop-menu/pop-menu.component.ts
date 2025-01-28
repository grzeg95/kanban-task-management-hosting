import {ChangeDetectionStrategy, Component, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'app-pop-menu',
  standalone: true,
  imports: [],
  templateUrl: './pop-menu.component.html',
  styleUrl: './pop-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-pop-menu'
  }
})
export class PopMenuComponent {
}
