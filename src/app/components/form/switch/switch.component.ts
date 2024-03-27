import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  HostBinding,
  ViewEncapsulation
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [],
  templateUrl: './switch.component.html',
  styleUrl: './switch.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-switch'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SwitchComponent),
      multi: true,
    }
  ]
})
export class SwitchComponent implements ControlValueAccessor {

  private static _id = 1;
  id = 'app-switch-id-' + SwitchComponent._id++;

  checked!: boolean;
  @HostBinding('class.app-switch--disabled') disabled!: boolean;

  constructor(
    private readonly _cdr: ChangeDetectorRef
  ) {
  }

  onChange = (_: any) => {
  };

  onTouched = () => {
  };

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean) {
    this.disabled = disabled;
    this._cdr.detectChanges();
  }

  writeValue(value: boolean): void {
    this.checked = value;
  }

  _onChange($event: Event) {
    $event.stopPropagation();
    this.onChange(($event.target as HTMLInputElement).checked);
  }

  _onTouched() {
    this.onTouched();
  }
}
