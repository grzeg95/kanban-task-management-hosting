export type InMemoryErrorCode =
  'invalid-argument'
  | 'not-found'
  | 'permission-denied'
  | 'resource-exhausted'
  | 'internal'
  | 'unauthenticated';

export type InMemoryErrorAbstractConstructor = {
  code: InMemoryErrorCode,
  message?: string,
  details?: string
};

export class InMemoryError {

  private static InMemoryErrorCodeMap = new Map<InMemoryErrorCode, string>([
    ['invalid-argument', 'Invalid argument'],
    ['not-found', 'Not found'],
    ['permission-denied', 'Permission denied'],
    ['resource-exhausted', 'Resource exhausted'],
    ['internal', 'Internal'],
    ['unauthenticated', 'Unauthenticated'],
  ]);

  constructor(
    private code: InMemoryErrorCode,
    private message?: string,
    private details?: string
  ) {
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message || InMemoryError.InMemoryErrorCodeMap.get(this.code),
      details: this.details
    }
  }

  static testRequirement(failed: boolean, error?: InMemoryErrorAbstractConstructor) {
    if (failed) {
      throw new InMemoryError(
        error?.code || 'internal',
        error?.message,
        error?.details
      )
    }
  }
}
