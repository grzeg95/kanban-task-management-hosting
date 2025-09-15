import {NgTemplateOutlet} from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef, HostBinding, HostListener,
  Input,
  Renderer2,
  ViewEncapsulation
} from '@angular/core';

type Appearance = 'primary' | 'secondary' | 'warn' | null | undefined;

export type ButtonSize = 'large' | 'small' | null | undefined;

const HOST_SELECTOR_CLASS_PAIR: {attribute: string; classes: string[]}[] = [
  {
    attribute: 'app-button',
    classes: ['app-button']
  }
];

@Component({
  selector: 'button[app-button]',
  imports: [
    NgTemplateOutlet
  ],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ButtonComponent implements AfterViewChecked {

  private readonly _element: HTMLElement;

  private _appearance: Appearance;
  private _buttonSize: ButtonSize;

  protected _innerText = '';

  @HostListener('click', ['$event'])
  handleOnClick($event: MouseEvent) {
    if (this.disabled) {
      $event.stopPropagation();
      $event.preventDefault();
    }
  }

  @Input() @HostBinding('disabled') disabled = false;
  @Input() svg: false | 'left' | 'right' = false;

  @Input()
  set appearance(appearance: Appearance) {

    if (this._appearance) {
      this._renderer.removeClass(this._element, `app-button--${this._appearance}`);
    }

    if (appearance) {
      this._renderer.addClass(this._element, `app-button--${appearance}`);
      this._appearance = appearance;
    }
  }

  @Input()
  set size(buttonSize: ButtonSize) {

    if (this._buttonSize) {
      this._renderer.removeClass(this._element, `app-button--${this._buttonSize}`);
    }

    if (buttonSize) {
      this._renderer.addClass(this._element, `app-button--${buttonSize}`);
      this._buttonSize = buttonSize;
    }
  }

  constructor(
    private readonly _elementRef: ElementRef,
    private readonly _renderer: Renderer2,
    private readonly _cdr: ChangeDetectorRef
  ) {

    this._element = this._elementRef.nativeElement;

    for (const {attribute, classes} of HOST_SELECTOR_CLASS_PAIR) {
      if (this._element.hasAttribute(attribute)) {
        classes.forEach((_class) => this._renderer.addClass(this._element, _class));
      }
    }
  }

  ngAfterViewChecked(): void {
    this._innerText = this._elementRef.nativeElement.innerText;
    this._cdr.detectChanges();
  }
}
