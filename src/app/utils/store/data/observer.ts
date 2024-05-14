export interface Unsubscribe {
  (): void;
}

export interface Observer<Next = unknown, Error = unknown> {
  next?: (next: Next) => void;
  error?: (error: Error) => void;
  complete?: () => void;
}
