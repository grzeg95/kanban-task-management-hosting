import {defer, Observable, OperatorFunction, tap} from 'rxjs';

export const tapOnce = <T>(fn: (value: T) => void): OperatorFunction<T, T> => {
  return (source: Observable<any>) =>
    defer(() => {
      let first = true;
      return source.pipe(
        tap<T>((payload) => {
          if (first) {
            fn(payload);
          }
          first = false;
        })
      );
    });
}
