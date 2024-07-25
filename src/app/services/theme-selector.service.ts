import {DOCUMENT, isPlatformBrowser} from '@angular/common';
import {Inject, Injectable, PLATFORM_ID, Renderer2, RendererFactory2} from '@angular/core';
import {Sig} from '../utils/Sig';

@Injectable({
  providedIn: 'root'
})
export class ThemeSelectorService {

  private readonly _renderer: Renderer2;
  readonly isDark = new Sig<boolean | undefined>(undefined);

  constructor(
    private readonly _rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private readonly _document: Document,
    @Inject(PLATFORM_ID) private readonly _platformId: NonNullable<unknown>
  ) {
    this._renderer = this._rendererFactory.createRenderer(null, null);
  }

  setLight() {

    const isBrowser = isPlatformBrowser(this._platformId);

    this._renderer.removeClass(this._document.body, 'dark');
    this._renderer.addClass(this._document.body, 'light');

    if (isBrowser) {
      localStorage.setItem('theme', 'light');
    }

    this.isDark.set(false);
  }

  setDark() {

    const isBrowser = isPlatformBrowser(this._platformId);

    this._renderer.removeClass(this._document.body, 'light');
    this._renderer.addClass(this._document.body, 'dark');

    if (isBrowser) {
      localStorage.setItem('theme', 'dark');
    }

    this.isDark.set(true);
  }

  loadTheme() {

    const isBrowser = isPlatformBrowser(this._platformId);

    if (isBrowser) {

      const storedTheme = localStorage.getItem('theme');

      if (storedTheme === 'light' || storedTheme === 'dark') {

        switch (storedTheme) {
          case 'light':
            this.setLight();
            break;
          case 'dark':
            this.setDark();
            break;
        }

      } else {

        let theme: 'dark' | 'light' = 'dark';

        const isLightMode = window.matchMedia('(prefers-color-scheme: light)').matches;

        if (!isLightMode) {
          theme = 'light';
        }

        switch (theme) {
          case 'light':
            this.setLight();
            break;
          case 'dark':
            this.setDark();
            break;
        }
      }

    } else {
      this.setDark();
    }
  }
}
