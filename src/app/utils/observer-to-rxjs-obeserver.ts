import {Observer, Unsubscribe} from '@npm/store';
import {Observable} from 'rxjs';

export function observerToRxjsObserver<Next, Error = unknown>(fnObserver: (observer: Observer<Next, Error>) => Unsubscribe) {
  return new Observable<Next>((subscriber) => {
    const unsubscribe = fnObserver({
      next: subscriber.next.bind(subscriber),
      error: subscriber.error.bind(subscriber),
      complete: subscriber.complete.bind(subscriber)
    });
    return {unsubscribe};
  });
}
