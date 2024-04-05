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
import {SvgDirective} from '../../../directives/svg.directive';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [
    SvgDirective
  ],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'app-textarea'
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    }
  ]
})
export class TextareaComponent implements ControlValueAccessor {

  private static _id = 1;
  protected id = 'app-textarea-id-' + TextareaComponent._id++;

  @ViewChild('input') input!: ElementRef<HTMLInputElement>;
  @Input({required: true}) placeholder!: string;
  @Input() rows = 2;
  @Input() removeAble = false;
  @Output() remove = new EventEmitter<void>();
  @Input() withHint = false;

  @HostBinding('style.margin-bottom.px')
  get marginBottom() {
    return this.withHint ? 32 : 11;
  }

  @HostBinding('class.app-textarea--disabled') @Input() disabled!: boolean;
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
    this.onChange(($event.target as HTMLInputElement).value);
  }

  _onInput($event: Event) {
    $event.stopPropagation();
    this.onChange(($event.target as HTMLInputElement).value);
  }

  _onTouched() {
    this.onTouched();
  }
}
