import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import {distinctUntilChanged, Observable, OperatorFunction, shareReplay} from 'rxjs';

export const getProtectedRxjsPipe = <T>(): OperatorFunction<T, T> => {
  return (source) => {
    return new Observable<T>((observer) => {
      return source.subscribe({
        next: (value?: T) => observer.next(cloneDeep(value)),
        error: (e: any) => observer.error(cloneDeep(e)),
        complete: () => observer.complete()
      });
    }).pipe(
      distinctUntilChanged((p, c) => isEqual(p, c))
    );
  };
}
