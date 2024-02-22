import {APP_INITIALIZER, ApplicationConfig} from '@angular/core';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import {ThemeSelectorService} from './services/theme-selector.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    ThemeSelectorService,
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [ThemeSelectorService],
      useFactory: (themeSelectorService: ThemeSelectorService) => {
        return () => themeSelectorService.loadTheme();
      }
    }
  ]
};
