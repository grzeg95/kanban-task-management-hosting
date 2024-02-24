import {ChangeDetectorRef, Directive, ElementRef, HostBinding, Input, OnChanges, Renderer2} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {filter, Subject} from 'rxjs';
import {SvgService} from '../services/svg.service';

@Directive({
  selector: '[appSvg]',
  standalone: true,
})
export class SvgDirective implements OnChanges {

  @Input({required: true}) appSvg!: string;
  @Input() @HostBinding('attr.aria-label') arialLabel!: string;

  private _onChanges = new Subject<SVGElement | undefined>();

  constructor(
    private _el: ElementRef,
    private _cdr: ChangeDetectorRef,
    private _renderer: Renderer2,
    private _svgService: SvgService
  ) {
    this._onChanges.pipe(
      filter((svg): svg is SVGElement => !!svg),
      takeUntilDestroyed()
    ).subscribe((svg) => {

      const nativeElement: HTMLElement = this._el.nativeElement;
      nativeElement.innerHTML = '';

      if (!svg.hasAttribute('viewBox')) {
        if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
          this._renderer.setAttribute(nativeElement, 'viewBox', `0 0 ${svg.getAttribute('width')} ${svg.getAttribute('height')}`);
        }
      }

      // copy all attributes

      svg.getAttributeNames().forEach((attrName) => {
        this._renderer.setAttribute(nativeElement, attrName, svg.getAttribute(attrName)!);
      });

      // append all elements

      svg.childNodes.forEach((node) => {
        this._renderer.appendChild(nativeElement, node.cloneNode(true));
      });

      this._cdr.markForCheck();
    });
  }

  ngOnChanges(): void {
    this._onChanges.next(this._svgService.getSvg(this.appSvg));
  }
}
