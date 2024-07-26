import {computed, effect, Inject, Injectable} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Auth, onAuthStateChanged, signInAnonymously, signOut, User as FirebaseUser} from 'firebase/auth';
import {Firestore} from 'firebase/firestore';
import {catchError, from, map, Observable, of, Subscription} from 'rxjs';
import {User} from '../models/user';
import {AuthInjectionToken, FirestoreInjectionToken} from '../tokens/firebase';
import {Sig} from '../utils/Sig';
import {docSnapshots} from './firebase/firestore';

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

  readonly userIsLoadedSig = new Sig<boolean>(false);
  readonly userSig = new Sig<User | null>();
  private _userSub: Subscription | undefined;

  readonly whileLoginInSig = new Sig<boolean>(false);

  constructor(
    @Inject(AuthInjectionToken) readonly _auth: Auth,
    @Inject(FirestoreInjectionToken) private readonly _firestore: Firestore
  ) {

    let firebaseUserUid: string | undefined;
    effect(() => {

      const firebaseUser = this.firebaseUser();

      if (!firebaseUser) {
        return;
      }

      if (firebaseUserUid === firebaseUser.uid) {
        return;
      }
      firebaseUserUid = firebaseUser.uid;

      const userRef = User.firestoreRef(this._firestore, firebaseUserUid);

      this.userIsLoadedSig.set(false);

      this._userSub && !this._userSub.closed && this._userSub.unsubscribe();
      this._userSub = docSnapshots(userRef).pipe(
        map(User.firestoreData),
        catchError((error) => {
          console.error(error);
          return of(null);
        })
      ).subscribe((user) => {

        if (user?.configLoaded) {
          this.userSig.set(user);
          this.userIsLoadedSig.set(true);
        }
      });

    });
  }

  signInAnonymously(): Promise<void> {
    this.whileLoginInSig.set(true);
    return signInAnonymously(this._auth).then(() => {
      this.whileLoginInSig.set(false);
    });
  }

  signOut(): Promise<void> {
    return signOut(this._auth);
  }
}
