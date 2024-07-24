import {Injectable, NgZone} from '@angular/core';
import {Auth, onAuthStateChanged, signInAnonymously, signOut, User as FirebaseUser} from '@angular/fire/auth';
import {docSnapshots, Firestore} from '@angular/fire/firestore';
import isEqual from 'lodash/isEqual';
import {BehaviorSubject, distinctUntilChanged, filter, from, map, Observable, of, shareReplay, switchMap} from 'rxjs';
import {User} from '../../models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  readonly authStateReady$ = from(this._auth.authStateReady());

  private readonly _firebaseUser$ = this.authStateReady$.pipe(
    switchMap(() => {
      return new Observable<FirebaseUser | null>((subscriber) => {
        const unsubscribe = onAuthStateChanged(this._auth, {
          next: subscriber.next.bind(subscriber),
          error: subscriber.error.bind(subscriber),
          complete: subscriber.complete.bind(subscriber)
        });
        return {unsubscribe};
      });
    }),
    shareReplay()
  );

  readonly isLoggedIn$ = this._firebaseUser$.pipe(
    map((firebaseUser) => !!firebaseUser)
  );

  readonly user$ = this._firebaseUser$.pipe(
    filter((firebaseUser): firebaseUser is FirebaseUser => !!firebaseUser),
    distinctUntilChanged((a, b) => isEqual(a.uid, b.uid)),
    switchMap((firebaseUser) => {

      if (firebaseUser) {

        this.resetFirstLoadings$.next();

        const userRef = User.firestoreRef(this._firestore, firebaseUser.uid);
        return docSnapshots(userRef).pipe(
          map(User.firestoreData)
        );
      }

      return of(null);
    })
  );

  readonly resetFirstLoadings$ = new BehaviorSubject<void>(undefined);

  readonly whileLoginIn$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly _ngZone: NgZone,
    private readonly _auth: Auth,
    private readonly _firestore: Firestore
  ) {
  }

  signInAnonymously(): Promise<void> {
    this.whileLoginIn$.next(true);
    return signInAnonymously(this._auth).then(() => {
      this.whileLoginIn$.next(false);
    });
  }

  signOut(): Promise<void> {
    return signOut(this._auth);
  }
}
