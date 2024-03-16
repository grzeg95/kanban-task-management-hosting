import {animate, state, style, transition, trigger} from '@angular/animations';
import {DIALOG_DATA} from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';

@Component({
  selector: 'app-snack-bar',
  standalone: true,
  imports: [],
  templateUrl: './snack-bar.component.html',
  styleUrl: './snack-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-snack-bar'
  },
  animations: [
    trigger(
      'state',
      [
        state('void',
          style({
            opacity: 0,
            transform: 'scale(0.8)'
          })
        ),
        state('visible',
          style({
            opacity: 1,
            transform: 'scale(1)'
          })
        ),
        transition(
          '* => visible',
          animate('0.150s ease-in')
        ),
        transition(
          '* => void',
          animate(
            '0.150s ease-in',
            style({
              opacity: 0
            })
          )
        )
      ]
    )
  ]
})
export class SnackBarComponent implements OnInit, OnDestroy {

  @HostBinding('@state') _animationState: 'void' | 'visible' = 'void';
  @Input() message: string = '';

  constructor(
    @Inject(DIALOG_DATA) public data: {message: string}
  ) {
    if (data) {
      this.message = data.message;
    }
  }

  ngOnInit() {
    this._animationState = 'visible';
  }

  ngOnDestroy() {
    this._animationState = 'void';
  }
}
