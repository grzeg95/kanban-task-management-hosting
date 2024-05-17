import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import {distinctUntilChanged, Observable, OperatorFunction} from 'rxjs';

export const getProtectedRxjsPipe = <T>(): OperatorFunction<T, T> => {
  return (source) => {
    return new Observable<T>((subscriber) => {
      return source.subscribe({
        next: (value?: T) => subscriber.next(cloneDeep(value)),
        error: (e: any) => subscriber.error(cloneDeep(e)),
        complete: () => subscriber.complete()
      });
    }).pipe(
      distinctUntilChanged((p, c) => isEqual(p, c))
    );
  };
}
