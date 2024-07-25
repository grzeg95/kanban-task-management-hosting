import {Inject, Injectable} from '@angular/core';
import {Functions, httpsCallable} from 'firebase/functions';
import {defer} from 'rxjs';
import {FunctionsInjectionToken} from '../../tokens/firebase';
import {SnackBarService} from '../snack-bar.service';

@Injectable({
  providedIn: 'root'
})
export class FunctionsService {

  constructor(
    @Inject(FunctionsInjectionToken) readonly _functions: Functions,
    private readonly _snackBarService: SnackBarService
  ) {
  }

  httpsCallable<RequestData = unknown, ResponseData = unknown>(name: string, data: RequestData) {
    return defer(
      () => httpsCallable<RequestData, ResponseData>(this._functions, name)(data)
        .then((res) => res.data)
        .catch((error) => {
          this._snackBarService.open(error.message);
          throw error;
        })
    );
  }
}
