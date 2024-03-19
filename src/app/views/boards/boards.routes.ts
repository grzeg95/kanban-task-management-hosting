import {inject} from '@angular/core';
import {redirectUnauthorizedTo} from '@angular/fire/auth-guard';
import {ActivatedRouteSnapshot, RouterStateSnapshot, Routes} from '@angular/router';
import {AppService} from '../../services/app.service';
import {authGuard} from '../../services/auth/auth-guard';
import {BoardComponent} from './board/board.component';
import {BoardsComponent} from './boards.component';

export const boardsRoutes: Routes = [
  {
    path: '',
    component: BoardsComponent,
    canActivate: [
      (r: ActivatedRouteSnapshot, s: RouterStateSnapshot) => authGuard(redirectUnauthorizedTo('/' + inject(AppService).unauthorizedView))(r, s)
    ],
    children: [
      {
        path: ':id',
        component: BoardComponent
      }
    ]
  }
];
