import {HttpClient, provideHttpClient} from '@angular/common/http';
import {APP_INITIALIZER, ApplicationConfig, importProvidersFrom} from '@angular/core';
import {getApp, initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {initializeAppCheck, provideAppCheck, ReCaptchaEnterpriseProvider} from '@angular/fire/app-check';
import {connectAuthEmulator, getAuth, provideAuth} from '@angular/fire/auth';
import {connectFirestoreEmulator, getFirestore, provideFirestore} from '@angular/fire/firestore';
import {connectFunctionsEmulator, getFunctions, provideFunctions} from '@angular/fire/functions';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {join} from 'path-browserify';
import {forkJoin, mergeMap} from 'rxjs';
import {environment} from '../environments/environment';
import {routes} from './app.routes';
import {KanbanConfig} from './kanban-config.token';
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
    },
    importProvidersFrom([
      provideFirebaseApp(() => initializeApp(environment.firebase)),
      provideAuth(() => {

        const auth = getAuth();

        if (!environment.production) {
          connectAuthEmulator(auth, `${environment.emulators.auth.protocol}://${environment.emulators.auth.host}:${environment.emulators.auth.port}`);
        }

        return auth;
      }),
      provideAppCheck(() => {
        const provider = new ReCaptchaEnterpriseProvider(environment.recaptchaEnterprise);
        return initializeAppCheck(undefined, {
          provider,
          isTokenAutoRefreshEnabled: true
        });
      }),
      provideFirestore(() => {
        const firestore = getFirestore();

        if (!environment.production) {
          connectFirestoreEmulator(firestore, environment.emulators.firestore.host, environment.emulators.firestore.port);
        }

        return firestore;
      }),
      provideFunctions(() => {

        const app = getApp();

        const functions = getFunctions(app, 'europe-central2');

        if (!environment.production) {
          connectFunctionsEmulator(functions, environment.emulators.functions.host, environment.emulators.functions.port);
        }

        return functions;
      })
    ]),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        return () => {
          if (!environment.production) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
          }
        }
      }
    },
    {
      provide: KanbanConfig,
      useValue: {
        maxUserBoards: 5,
        maxBoardStatuses: 5,
        maxBoardTasks: 20,
        maxBoardTaskSubtasks: 10
      } as KanbanConfig
    }
  ]
};
