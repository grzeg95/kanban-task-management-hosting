import {Injectable, NgZone, signal} from '@angular/core';
import {Auth, onAuthStateChanged, signInAnonymously, signOut, User as FirebaseUser} from '@angular/fire/auth';
import {DocumentSnapshot} from '@angular/fire/firestore';
import {Router} from '@angular/router';
import {Observable, Subscription} from 'rxjs';
import {User} from '../../models/user';
import {runInZoneRxjsPipe} from '../../utils/run-in-zone.rxjs-pipe';
import {AppService} from '../app.service';
import {FirestoreService} from '../firebase/firestore.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private _userDocSnapSub: Subscription | undefined;

  readonly firebaseUser = signal<FirebaseUser | null | undefined>(undefined);
  readonly userDocSnap = signal<DocumentSnapshot<User> | null | undefined>(undefined);
  readonly isLoggedIn = signal<boolean | undefined>(undefined);
  readonly whileLoginIn = signal<boolean>(false);

  constructor(
    private readonly _auth: Auth,
    private readonly _firestoreService: FirestoreService,
    private readonly _router: Router,
    private readonly _ngZone: NgZone,
    private readonly _appService: AppService
  ) {
    this._auth.authStateReady().then(() => {
      this._onAuthStateChanged().subscribe((nextFirebaseUser) => {

        const firebaseUser = this.firebaseUser();

        if (!nextFirebaseUser || !firebaseUser || nextFirebaseUser.uid !== firebaseUser.uid) {
          this._unsubUserDocSnapSub();

          if (nextFirebaseUser) {
            this._userDocSnapSub = this._firestoreService.docOnSnapshot<User>(`users/${nextFirebaseUser.uid}`).subscribe((userDocSnap) => {
              this.userDocSnap.set(userDocSnap);
            });

            const url = this._router.getCurrentNavigation()?.extractedUrl.toString() || '/';

            if (!this._appService.availableUserViews.some((path) => +url.startsWith('/' + path))) {
              this._router.navigate(['/', this._appService.defaultUserView]);
            }
          }
        }

        if (!nextFirebaseUser) {
          this._router.navigate(['/']);
        }

        this.firebaseUser.set(nextFirebaseUser);
        this.isLoggedIn.set(!!nextFirebaseUser);
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
    this.whileLoginIn.set(true);
    signInAnonymously(this._auth).then(() => {
      this.whileLoginIn.set(false);
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
