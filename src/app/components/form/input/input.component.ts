import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {SvgHoverDirective} from '../../../directives/svg-hover.directive';
import {SvgDirective} from '../../../directives/svg.directive';
import {handleTabIndex} from '../../../utils/handle-tabindex';

@Component({
  selector: 'app-input',
  imports: [
    SvgDirective,
    SvgHoverDirective
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-input'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    }
  ]
})
export class InputComponent implements ControlValueAccessor {

  @ViewChild('removeIcon') protected removeIcon: ElementRef | undefined;

  private static _id = 1;
  protected readonly _id = 'app-input-id-' + InputComponent._id++;

  @Input({required: true}) placeholder!: string;
  @Input() removeAble = false;
  @Output() remove = new EventEmitter<void>();
  @Input() withHint = false;

  @HostBinding('style.margin-bottom.px')
  get marginBottom() {
    return this.withHint ? 32 : 11;
  }

  @HostBinding('class.app-input--disabled') @Input() disabled!: boolean;
  value = '';

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
  }

  writeValue(value: string): void {
    this.value = value;
  }

  _onChange($event: Event) {
    $event.stopPropagation();

    if (this.disabled) {
      $event.preventDefault();
      return;
    }

    this.onChange(($event.target as HTMLInputElement).value);
  }

  _onInput($event: Event) {
    $event.stopPropagation();

    if (this.disabled) {
      $event.preventDefault();
      return;
    }

    this.onChange(($event.target as HTMLInputElement).value);
  }

  _onTouched() {
    this.onTouched();
  }

  handleClickRemoveButton($event: KeyboardEvent | MouseEvent) {

    if (handleTabIndex($event)) return;
    $event.preventDefault();
    $event.stopPropagation();

    this.remove.emit();
  }
}
