import {Injectable, NgZone} from '@angular/core';
import {Auth, onAuthStateChanged, signInAnonymously, signOut, User as FirebaseUser} from '@angular/fire/auth';
import cloneDeep from 'lodash/cloneDeep';
import {BehaviorSubject, map, Observable, Subscription} from 'rxjs';
import {runInZoneRxjsPipe} from '../../utils/run-in-zone.rxjs-pipe';
import {FirestoreService} from '../firebase/firestore.service';
import {User} from './user.model';

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

  constructor(
    private readonly _auth: Auth,
    private readonly _firestoreService: FirestoreService,
    private readonly _ngZone: NgZone
  ) {
    this._auth.authStateReady().then(() => {
      this._onAuthStateChanged().subscribe((nextFirebaseUser) => {

        const firebaseUser = this._firebaseUser;

        if (!nextFirebaseUser || !firebaseUser || nextFirebaseUser.uid !== firebaseUser.uid) {
          this._unsubUserDocSnapSub();

          if (nextFirebaseUser) {

            this._userDocSnapSub = this._firestoreService.docOnSnapshot<User>(`users/${nextFirebaseUser.uid}`)
              .pipe(
                map((userDoc) => {

                  const user: User = {
                    boards: userDoc.data()?.boards || [],
                    id: userDoc.id,
                  };

                  return user;
                }),
              ).subscribe((user) => {
                this.user$.next(cloneDeep(user));
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
