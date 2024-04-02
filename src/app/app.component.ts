import {Component} from '@angular/core';
import {NavComponent} from './components/nav/nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    NavComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
}
