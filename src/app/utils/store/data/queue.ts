export class QueueItem<Id, Data> {
  constructor(
    public id: Id,
    public data: Data,
    public next: QueueItem<Id, Data> | null = null,
    public prev: QueueItem<Id, Data> | null = null
  ) {
  }
}

export class Queue<Id, Data> {

  private _size = 0;
  private _items = new Map<Id, QueueItem<Id, Data>>();

  get size(): number {
    return this._size;
  }

  constructor(
    private front: QueueItem<Id, Data> | null = null,
    private rear: QueueItem<Id, Data> | null = null
  ) {
  }

  enqueue(id: Id, data: Data) {

    const newQueueItem = new QueueItem(id, data);
    this._items.set(id, newQueueItem);

    if (this.front === null) {
      this.front = newQueueItem;
      this.rear = newQueueItem;
    } else {
      this.rear!.next = newQueueItem;
      this.rear = newQueueItem;
    }

    this._size++;
  }

  dequeue() {

    if (this.front === null) {
      return null;
    }

    const data = this.front!.data;
    const id = this.front!.id;
    this.front = this.front!.next;
    this._items.delete(id);

    this._size--;
    return data;
  }

  removeItem(id: Id) {

    const item = this._items.get(id);

    if (item) {

      const next = item.next;
      const prev = item.prev;

      if (next) {
        next.prev = null;
      }

      if (prev) {
        prev.next = null;
      }

      if (next && prev) {
        prev.next = next;
        next.prev = prev;
      }

      this._size--;
      return item.data;
    }

    return null;
  }
}
