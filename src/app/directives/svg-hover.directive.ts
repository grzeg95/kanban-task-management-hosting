import {Directive, ElementRef, HostBinding, HostListener, Input, OnChanges, Renderer2} from '@angular/core';

@Directive({
  selector: '[appSvgHover]',
  standalone: true
})
export class SvgHoverDirective implements OnChanges {

  @HostBinding('style.cursor') cursor = 'pointer';

  @Input({required: true}) appSvgHover!: string;

  private readonly _elementsFill: Map<Element, string | undefined> = new Map();

  @HostListener('mouseenter')
  handleOnMouseEnter() {
    for (const [element, fill] of this._elementsFill) {
      if (fill) {
        this._renderer.setAttribute(element, 'fill', this.appSvgHover);
      }
    }
  }

  @HostListener('mouseleave')
  handleOnMouseLeave() {
    for (const [element, fill] of this._elementsFill) {
      if (fill) {
        this._renderer.setAttribute(element, 'fill', fill);
      }
    }
  }

  constructor(
    private readonly _elementRef: ElementRef,
    private readonly _renderer: Renderer2
  ) {
  }

  ngOnChanges(): void {

    this._elementsFill.clear();
    const elements = this._elementRef.nativeElement.getElementsByTagName('*') as HTMLCollection;

    for (let i = 0; i < elements.length; ++i) {
      this._elementsFill.set(elements[i], elements[i].attributes.getNamedItem('fill')?.value);
    }
  }
}
