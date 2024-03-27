import {NgClass} from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  HostBinding,
  HostListener,
  Input,
  ViewEncapsulation
} from '@angular/core';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {SvgDirective} from '../../../directives/svg.directive';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [
    NgClass,
    SvgDirective
  ],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-checkbox'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    }
  ]
})
export class CheckboxComponent {

  private static _id = 1;
  readonly id = 'app-checkbox-id-' + CheckboxComponent._id++;
  @Input() @HostBinding('class.app-checkbox--checked') checked!: boolean;
  @HostBinding('class.app-checkbox--disabled') @Input() disabled!: boolean;

  constructor(
    private readonly _cdr: ChangeDetectorRef
  ) {
  }

  @HostListener('click', ['$event'])
  handleOnClick($event: MouseEvent) {

    $event.stopPropagation();
    $event.preventDefault();

    if (this.disabled) {
      return;
    }

    this.onChange(!this.checked);
    this.writeValue(!this.checked);
  }

  @HostListener('blur', ['$event'])
  handleOnBlur($event: MouseEvent) {

    $event.stopPropagation();
    $event.preventDefault();

    if (this.disabled) {
      return;
    }

    this._onTouched();
  }

  public onChange = (_: any) => {
  };

  public onTouched = () => {
  };

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this._cdr.detectChanges();
  }

  writeValue(obj: any): void {
    this.checked = obj;
  }

  _onTouched() {
    this.onTouched();
  }
}
