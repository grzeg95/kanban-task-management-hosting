import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {NavComponent} from './components/nav/nav.component';
import {
  SideBarPhoneWrapperComponent
} from './components/side-bar-phone/side-bar-phone-wrapper/side-bar-phone-wrapper.component';
import {SideBarComponent} from './components/side-bar/side-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SideBarComponent,
    SideBarPhoneWrapperComponent,
    RouterOutlet,
    NavComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
}
