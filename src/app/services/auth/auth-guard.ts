import {inject} from '@angular/core';
import {Auth, user} from '@angular/fire/auth';
import {AuthPipe, AuthPipeGenerator, loggedIn} from '@angular/fire/auth-guard';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';
import {map, take} from 'rxjs';

export const authGuard = (authPipe?: AuthPipe) => (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {

  const auth = inject(Auth);
  const router = inject(Router);
  const authPipeFactory = (authPipe ? (() => authPipe) : (() => loggedIn)) as AuthPipeGenerator;

  return user(auth).pipe(
    take(1),
    authPipeFactory(next, state),
    map(can => {
      if (typeof can === 'boolean') {
        return can;
      } else if (Array.isArray(can)) {
        return router.createUrlTree(can);
      } else {
        return router.parseUrl(can);
      }
    })
  );
}
