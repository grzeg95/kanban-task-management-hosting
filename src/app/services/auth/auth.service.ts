import {Injectable, NgZone} from '@angular/core';
import {Auth, onAuthStateChanged, signInAnonymously, signOut, User as FirebaseUser} from '@angular/fire/auth';
import {Firestore} from '@angular/fire/firestore';
import {BehaviorSubject, map, Observable, Subscription} from 'rxjs';
import {User, UserDoc} from '../../models/user';
import {runInZoneRxjsPipe} from '../../utils/run-in-zone.rxjs-pipe';
import {docSnapshots} from '../firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _userDocSnapSub: Subscription | undefined;

  readonly authStateReady$ = new BehaviorSubject<boolean>(false);
  private _firebaseUser: FirebaseUser | null | undefined;
  readonly user$ = new BehaviorSubject<User | null | undefined>(undefined);
  readonly isLoggedIn$ = new BehaviorSubject<boolean | undefined>(undefined);
  readonly whileLoginIn$ = new BehaviorSubject<boolean>(false);
  readonly resetFirstLoadings$ = new BehaviorSubject<void>(undefined);

  constructor(
    private readonly _auth: Auth,
    private readonly _firestore: Firestore,
    private readonly _ngZone: NgZone
  ) {
    this._auth.authStateReady().then(() => {
      this._onAuthStateChanged().subscribe((nextFirebaseUser) => {

        const firebaseUser = this._firebaseUser;

        if (!nextFirebaseUser || !firebaseUser || nextFirebaseUser.uid !== firebaseUser.uid) {
          this._unsubUserDocSnapSub();

          if (nextFirebaseUser) {

            this.resetFirstLoadings$.next();

            const userRef = User.firestoreRef(this._firestore, nextFirebaseUser.uid);
            this._userDocSnapSub = docSnapshots<User, UserDoc>(userRef).pipe(
              map((user) => {
                return User.firestoreData(user);
              }),
            ).subscribe((user) => {
              this.user$.next(user);
            });

          } else {
            this.user$.next(null);
          }
        }

        this._firebaseUser = nextFirebaseUser;
        this.isLoggedIn$.next(!!nextFirebaseUser);

        this.authStateReady$.next(true);
      });
    })
  }

  private _onAuthStateChanged() {
    return new Observable<FirebaseUser | null>((subscriber) => {
      const unsubscribe = onAuthStateChanged(this._auth, {
        next: subscriber.next.bind(subscriber),
        error: subscriber.error.bind(subscriber),
        complete: subscriber.complete.bind(subscriber),
      });
      return {unsubscribe};
    }).pipe(
      runInZoneRxjsPipe(this._ngZone)
    );
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

  private _unsubUserDocSnapSub(): void {
    if (this._userDocSnapSub && !this._userDocSnapSub.closed) {
      this._userDocSnapSub.unsubscribe();
    }
  }
}
