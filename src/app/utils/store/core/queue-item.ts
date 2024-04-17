export class QueueItem<T> {
  constructor(
    public data: T,
    public next: QueueItem<T> | null = null
  ) {
  }
}

