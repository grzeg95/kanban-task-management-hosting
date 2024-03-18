import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: 'boards',
    loadChildren: () => import('./views/boards/boards.routes').then((f) => f.boardsRoutes)
  }
];
