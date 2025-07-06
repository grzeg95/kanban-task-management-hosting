import {DestroyRef, Inject, Injectable} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Auth, onAuthStateChanged, signInAnonymously, signOut, User as FirebaseUser} from 'firebase/auth';
import {Firestore} from 'firebase/firestore';
import {BehaviorSubject, catchError, combineLatest, from, map, Observable, of, Subscription} from 'rxjs';
import {User} from '../models/user';
import {AuthInjectionToken, FirestoreInjectionToken} from '../tokens/firebase';
import {docSnapshots} from './firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  readonly authStateReady$ = from(this._auth.authStateReady()).pipe(
    map(() => true)
  );

  readonly firebaseUser$ = new Observable<FirebaseUser | null>((subscriber) => {
    const unsubscribe = onAuthStateChanged(this._auth, {
      next: subscriber.next.bind(subscriber),
      error: subscriber.error.bind(subscriber),
      complete: subscriber.complete.bind(subscriber)
    });
    return {unsubscribe};
  });

  readonly isLoggedIn$ = this.firebaseUser$.pipe(
    map((isLoggedIn) => !!isLoggedIn)
  );

  readonly loadingUser$ = new BehaviorSubject<boolean>(true);
  readonly user$ = new BehaviorSubject<User | null | undefined>(undefined);
  private _userSub: Subscription | undefined;

  readonly whileLoginIn$ = new BehaviorSubject<boolean>(false);

  constructor(
    @Inject(AuthInjectionToken) readonly _auth: Auth,
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore,
    private readonly _destroyRef: DestroyRef
  ) {

    combineLatest([
      this.firebaseUser$
    ]).subscribe(([firebaseUser]) => {

      if (!firebaseUser) {
        this.user$.next(null);
        this.loadingUser$.next(false);
        this._userSub && !this._userSub.closed && this._userSub.unsubscribe();
        return;
      }

      const userRef = User.firestoreRef(this._firestore, firebaseUser.uid);

      this.loadingUser$.next(true);
      this._userSub && !this._userSub.closed && this._userSub.unsubscribe();

      this._userSub = docSnapshots(userRef).pipe(
        takeUntilDestroyed(this._destroyRef),
        map(User.firestoreData),
        catchError(() => of(null))
      ).subscribe((user) => {

        if (user?.configLoaded) {
          this.user$.next(user);
        } else {
          this.user$.next(undefined);
        }

        this.loadingUser$.next(false);
      });

    });
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
