import {computed, effect, Inject, Injectable} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Auth, onAuthStateChanged, signInAnonymously, signOut, User as FirebaseUser} from 'firebase/auth';
import {Firestore} from 'firebase/firestore';
import {catchError, from, map, Observable, of, Subscription} from 'rxjs';
import {User} from '../../models/user';
import {AuthInjectionToken, FirestoreInjectionToken} from '../../tokens/firebase';
import {Sig} from '../../utils/Sig';
import {docSnapshots} from '../firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  readonly authStateReady = toSignal(from(this._auth.authStateReady()));

  readonly firebaseUser = toSignal(new Observable<FirebaseUser | null>((subscriber) => {
    const unsubscribe = onAuthStateChanged(this._auth, {
      next: subscriber.next.bind(subscriber),
      error: subscriber.error.bind(subscriber),
      complete: subscriber.complete.bind(subscriber)
    });
    return {unsubscribe};
  }));

  readonly isLoggedIn = computed(() => {
    return !!this.firebaseUser();
  });

  readonly userIsLoaded = new Sig<boolean>(false);
  readonly user = new Sig<User | null>();
  userSub: Subscription | undefined;

  readonly whileLoginIn = new Sig<boolean>(false);

  constructor(
    @Inject(AuthInjectionToken) readonly _auth: Auth,
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore
  ) {

    effect(() => {

      const firebaseUser = this.firebaseUser();

      this.userSub && !this.userSub.closed && this.userSub.unsubscribe();

      if (!firebaseUser) {
        return;
      }

      const userRef = User.firestoreRef(this._firestore, firebaseUser.uid);

      this.userIsLoaded.set(false);

      this.userSub = docSnapshots(userRef).pipe(
        map(User.firestoreData),
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      ).subscribe((user) => {

        if (user?.configLoaded) {
          this.user.set(user);
          this.userIsLoaded.set(true);
        }
      });

    });
  }

  signInAnonymously(): Promise<void> {
    this.whileLoginIn.set(true);
    return signInAnonymously(this._auth).then(() => {
      this.whileLoginIn.set(false);
    });
  }

  signOut(): Promise<void> {
    return signOut(this._auth);
  }
}
