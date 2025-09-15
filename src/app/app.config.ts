import {HttpClient, provideHttpClient} from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
  Provider
} from '@angular/core';
import {provideAnimations} from '@angular/platform-browser/animations';
import {provideRouter} from '@angular/router';
import {initializeApp} from 'firebase/app';
import {initializeAppCheck, ReCaptchaEnterpriseProvider} from 'firebase/app-check';
import {connectAuthEmulator, getAuth, signInAnonymously} from 'firebase/auth';
import {connectFirestoreEmulator, getFirestore} from 'firebase/firestore';
import {connectFunctionsEmulator, getFunctions} from 'firebase/functions';
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

  // sign in anonymously on start
  signInAnonymously(auth);

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
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimations(),
    ThemeSelectorService,
    provideAppInitializer(() => {
      const themeSelectorService = inject(ThemeSelectorService);
      return themeSelectorService.loadTheme();
    }),
    provideHttpClient(),
    provideAppInitializer(() => {

      const http = inject(HttpClient);
      const svgService = inject(SvgService);

      const path = '/assets/images/svgs';

      return http.get<{name: string, src: string}[]>(
        join(path, 'index.json')
      ).pipe(
        mergeMap((svgs) => {
          return forkJoin(
            svgs.map((svg) => svgService.registerSvg(svg.name, join(path, svg.src)))
          );
        })
      )
    }),
    provideFirebase()
  ]
};
