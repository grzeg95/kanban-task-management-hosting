import {Inject, Injectable} from '@angular/core';
import {AvailableUserViews, DefaultUserView, UnauthorizedView} from '../tokens/view';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(
    @Inject(UnauthorizedView) readonly unauthorizedView = '',
    @Inject(AvailableUserViews) readonly availableUserViews = [''],
    @Inject(DefaultUserView) readonly defaultUserView = ''
  ) {
  }
}
