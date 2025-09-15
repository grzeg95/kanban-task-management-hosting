import {isPlatformBrowser} from '@angular/common';
import {DOCUMENT, inject, Injectable, PLATFORM_ID, Renderer2, RendererFactory2} from '@angular/core';
import {BehaviorSubject, combineLatest} from 'rxjs';
import {User} from '../models/user';
import {FirestoreInjectionToken} from '../tokens/firebase';
import {AuthService} from './auth.service';
import {updateDoc} from './firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class ThemeSelectorService {

  private readonly _rendererFactory = inject(RendererFactory2);
  private readonly _document = inject(DOCUMENT);
  private readonly _platformId = inject(PLATFORM_ID) as NonNullable<unknown>;
  private readonly _authService = inject(AuthService);
  private readonly _firestore = inject(FirestoreInjectionToken);

  private readonly _renderer: Renderer2;
  readonly darkMode$ = new BehaviorSubject<boolean | undefined>(undefined);
  private readonly _user$ = this._authService.user$;

  constructor() {
    this._renderer = this._rendererFactory.createRenderer(null, null);

    let userDarkMode: boolean | null;
    combineLatest([
      this._user$
    ]).subscribe(([user]) => {

      if (!user) {
        return;
      }

      if (userDarkMode === user.darkMode) {
        return;
      }
      userDarkMode = user.darkMode;

      if (userDarkMode === null) {
        return;
      }

      if (!userDarkMode) {
        this.setLight();
      } else {
        this.setDark();
      }
    });
  }

  setLight() {

    const isBrowser = isPlatformBrowser(this._platformId);

    this._renderer.removeClass(this._document.body, 'dark');
    this._renderer.addClass(this._document.body, 'light');

    if (isBrowser) {
      localStorage.setItem('theme', 'light');
    }

    this.darkMode$.next(false);

    const user = this._user$.value;

    if (user && user.darkMode !== null && user.darkMode) {
      const userRef = User.firestoreRef(this._firestore, user.id);

      updateDoc(userRef, {
        darkMode: false
      }).subscribe();
    }
  }

  setDark() {

    const isBrowser = isPlatformBrowser(this._platformId);

    this._renderer.removeClass(this._document.body, 'light');
    this._renderer.addClass(this._document.body, 'dark');

    if (isBrowser) {
      localStorage.setItem('theme', 'dark');
    }

    this.darkMode$.next(true);

    const user = this._user$.value;

    if (user && !user.darkMode) {
      const userRef = User.firestoreRef(this._firestore, user.id);

      updateDoc(userRef, {
        darkMode: true
      }).subscribe();
    }
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
