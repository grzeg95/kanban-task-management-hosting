import {HttpClient, provideHttpClient} from '@angular/common/http';
import {APP_INITIALIZER, ApplicationConfig} from '@angular/core';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {join} from 'path-browserify';
import {forkJoin, mergeMap} from 'rxjs';
import {routes} from './app.routes';
import {SvgService} from './services/svg.service';
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
    },
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [SvgService, HttpClient],
      useFactory: (svgService: SvgService, http: HttpClient) => {

        const path = '/assets/images/svgs';

        return () => http.get<{name: string, src: string}[]>(
          join(path, 'index.json')
        ).pipe(
          mergeMap((svgs) => {
            return forkJoin(
              svgs.map((svg) => svgService.registerSvg(svg.name, join(path, svg.src)))
            );
          })
        )
      }
    }
  ]
};
