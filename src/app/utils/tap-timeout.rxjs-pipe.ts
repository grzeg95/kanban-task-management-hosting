import {defer, delay, Observable, OperatorFunction, tap, timer} from 'rxjs';

export const tapTimeoutRxjsPipe = <T>(fn: (value: T) => void): OperatorFunction<T, T> => {
  return (source: Observable<any>) =>
    defer(() => {
      return source.pipe(
        delay(0),
        tap<T>((payload) => {
          fn(payload);
        })
      );
    });
}
