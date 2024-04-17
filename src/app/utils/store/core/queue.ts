import {QueueItem} from './queue-item';

export class Queue<T> {

  constructor(
    private front: QueueItem<T> | null = null,
    private rear: QueueItem<T> | null = null,
    public size = 0
  ) {
  }

  isEmpty() {
    return this.size === 0;
  }

  enqueue(data: T) {

    const newQueueItem = new QueueItem(data);

    if (this.isEmpty()) {
      this.front = newQueueItem;
    } else {
      if (this.rear) {
        this.rear.next = newQueueItem;
      }
    }

    this.rear = newQueueItem;
    this.size++;
  }

  dequeue() {

    if (this.isEmpty()) {
      return null;
    }

    const data = this.front!.data;
    this.front = this.front!.next;

    if (this.front === null) {
      this.rear = null;
    }

    this.size--;

    return data;
  }
}
