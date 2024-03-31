import {Injectable, NgZone} from '@angular/core';
import {Auth, onAuthStateChanged, signInAnonymously, signOut, User as FirebaseUser} from '@angular/fire/auth';
import {Router} from '@angular/router';
import cloneDeep from 'lodash/cloneDeep';
import {BehaviorSubject, map, Observable, Subscription} from 'rxjs';
import {runInZoneRxjsPipe} from '../../utils/run-in-zone.rxjs-pipe';
import {AppService} from '../app.service';
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
    private readonly _router: Router,
    private readonly _ngZone: NgZone,
    private readonly _appService: AppService
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
              ).subscribe((user) => this.user$.next(cloneDeep(user)));

            const url = this._router.getCurrentNavigation()?.extractedUrl.toString() || '/';

            if (!this._appService.availableUserViews.some((path) => +url.startsWith('/' + path))) {
              this._router.navigate(['/', this._appService.defaultUserView]);
            }
          }
        }

        if (!nextFirebaseUser) {
          this._router.navigate(['/']);
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

  signInAnonymously(): void {
    this.whileLoginIn$.next(true);
    signInAnonymously(this._auth).then(() => {
      this.whileLoginIn$.next(false);
    });
  }

  signOut(): void {
    signOut(this._auth);
  }

  private _unsubUserDocSnapSub(): void {
    if (this._userDocSnapSub && !this._userDocSnapSub.closed) {
      this._userDocSnapSub.unsubscribe();
    }
  }
}
