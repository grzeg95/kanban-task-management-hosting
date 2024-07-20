import {HttpClient, provideHttpClient} from '@angular/common/http';
import {APP_INITIALIZER, ApplicationConfig, provideExperimentalZonelessChangeDetection, Provider} from '@angular/core';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {initializeApp} from 'firebase/app';
import {getAuth, connectAuthEmulator} from 'firebase/auth';
import {initializeAppCheck, ReCaptchaEnterpriseProvider} from 'firebase/app-check';
import {getFirestore, connectFirestoreEmulator} from 'firebase/firestore';
import {getFunctions, connectFunctionsEmulator} from 'firebase/functions';
import {join} from 'path-browserify';
import {forkJoin, mergeMap} from 'rxjs';
import {environment} from '../environments/environment';
import {routes} from './app.routes';
import {SvgService} from './services/svg.service';
import {ThemeSelectorService} from './services/theme-selector.service';
import {
  AppCheckInjectionToken,
  AuthInjectionToken,
  FirebaseAppInjectionToken,
  FirestoreInjectionToken,
  FunctionsInjectionToken
} from './tokens/firebase';

if (!environment.production) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const provideFirebase = () => {

  const providers: Provider[] = [];

  // Firebase app

  const app = initializeApp(environment.firebase);

  providers.push({
    provide: FirebaseAppInjectionToken,
    useValue: app
  });

  // Firebase auth

  const auth = getAuth();

  if (!environment.production) {
    connectAuthEmulator(auth, `${environment.emulators.auth.protocol}://${environment.emulators.auth.host}:${environment.emulators.auth.port}`);
  }

  providers.push({
    provide: AuthInjectionToken,
    useValue: auth
  });

  // Firebase app check

  const provider = new ReCaptchaEnterpriseProvider(environment.recaptchaEnterprise);

  const appCheck = initializeAppCheck(undefined, {
    provider,
    isTokenAutoRefreshEnabled: true
  });

  providers.push({
    provide: AppCheckInjectionToken,
    useValue: appCheck
  });

  // Firebase firestore

  const firestore = getFirestore();

  if (!environment.production) {
    connectFirestoreEmulator(firestore, environment.emulators.firestore.host, environment.emulators.firestore.port);
  }

  providers.push({
    provide: FirestoreInjectionToken,
    useValue: firestore
  });

  // Firebase functions

  const functions = getFunctions(app, 'europe-central2');

  if (!environment.production) {
    connectFunctionsEmulator(functions, environment.emulators.functions.host, environment.emulators.functions.port);
  }

  providers.push({
    provide: FunctionsInjectionToken,
    useValue: functions
  });

  // return providers

  return providers;
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
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
    provideFirebase()
  ]
};
