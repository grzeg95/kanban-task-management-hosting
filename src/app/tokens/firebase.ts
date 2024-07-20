import {InjectionToken} from '@angular/core';
import {FirebaseApp as _FirebaseApp} from 'firebase/app';
import {Auth as _Auth} from 'firebase/auth';
import {AppCheck as _AppCheck} from 'firebase/app-check';
import {Firestore as _Firestore} from 'firebase/firestore';
import {Functions as _Functions} from 'firebase/functions';

export const FirebaseAppInjectionToken = new InjectionToken<_FirebaseApp>('FirebaseApp');
export const AuthInjectionToken = new InjectionToken<_Auth>('Auth');
export const AppCheckInjectionToken = new InjectionToken<_AppCheck>('AppCheck');
export const FirestoreInjectionToken = new InjectionToken<_Firestore>('Firestore');
export const FunctionsInjectionToken = new InjectionToken<_Functions>('Functions');
