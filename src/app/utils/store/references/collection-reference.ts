import {Observer, uid, Unsubscribe} from '../data';
import {DocumentSnapshot, DocumentSnapshotError, Document, doc} from '../objects';
import {Storage} from '../storage';
import {getPathPartRegex} from '../utils';
import {DocumentReference} from './document-reference';

export class CollectionReference {

  private static _extension = new Map<string, CollectionReference>();

  public readonly path: string;

  private constructor(
    public readonly storage: Storage,
    public readonly id: string,
    public readonly parentReference: DocumentReference | null
  ) {

    const pathParts: string[] = [];

    if (parentReference) {
      pathParts.push(parentReference.path);
    }

    pathParts.push(this.id);

    this.path = pathParts.join('/');
  }

  private static _createInstance(storage: Storage, id: string, parentReference: DocumentReference | null) {

    const keyParts: string[] = [];

    if (parentReference) {
      keyParts.push(parentReference.path);
    } else {
      keyParts.push(storage.projectId, storage.constructor.name);
    }
    keyParts.push(id);

    const key = keyParts.join('/');
    const instance = new CollectionReference(storage, id, parentReference);
    this._extension.set(key, instance);
    return instance;
  }

  static getInstance(storage: Storage, id: string, parentReference: DocumentReference | null) {

    const keyParts: string[] = [];

    if (parentReference) {
      keyParts.push(parentReference.path);
    } else {
      keyParts.push(storage.projectId, storage.constructor.name);
    }
    keyParts.push(id);

    const key = keyParts.join('/');
    return CollectionReference._extension.get(key) || CollectionReference._createInstance(storage, id, parentReference);
  }

  doc(id?: string) {

    if (!id) {
      id = uid();
    }

    if (!getPathPartRegex().test(id)) {
      throw new Error('Document id must have only small and big letters with numbers and [-_ ]');
    }

    return DocumentReference.getInstance(this, id);
  }

  snapshot(): Promise<DocumentSnapshot[]>;
  snapshot(observer?: Observer<DocumentSnapshot[], DocumentSnapshotError>): Unsubscribe;

  snapshot(observer?: Observer<DocumentSnapshot[], DocumentSnapshotError>): Promise<DocumentSnapshot[]> | Unsubscribe {

    if (observer) {

      return this.storage.getDocuments(this, {
        next: async (documents) => {

          const documentSnapshotsPromise: Promise<DocumentSnapshot>[] = [];

          for (const document of documents) {
            documentSnapshotsPromise.push(document.snapshot());
          }

          Promise.all(documentSnapshotsPromise).then((documentSnapshots) => {
            observer.next?.(documentSnapshots);
          }).catch((error) => {
            observer.error?.(error);
          });
        },
        error: (error) => {
          observer.error?.(error);
        }
      });
    }

    return this.storage.getDocuments(this).then((documents) => {

      const documentSnapshotsPromise: Promise<DocumentSnapshot>[] = [];

      for (const document of documents) {
        documentSnapshotsPromise.push(document.snapshot());
      }

      return Promise.all(documentSnapshotsPromise);
    });
  }

  snapshots(observer: Observer<DocumentSnapshot[], DocumentSnapshotError>): Unsubscribe {

    let documentSnapshotsUnsubscribes: Unsubscribe[] = [];

    const unsubscribeDocumentSnapshotsUnsubscribes = () => {
      for (const documentSnapshotsUnsubscribe of documentSnapshotsUnsubscribes) {
        documentSnapshotsUnsubscribe();
      }
      documentSnapshotsUnsubscribes = [];
    };

    return this.storage.getDocuments(this, {
      next: (documents) => {

        unsubscribeDocumentSnapshotsUnsubscribes();

        let remainingFirstValues = documents.length;
        const values = new Array<DocumentSnapshot | undefined>(documents.length);

        for (let i = 0; i < documents.length; ++i) {

          const innerObserver: Observer<DocumentSnapshot, DocumentSnapshotError> = {
            next: (documentSnapshot) => {

              if (!documentSnapshot.exists) {
                innerObserver.complete?.();
                values[i] = undefined;
              } else {
                values[i] = documentSnapshot;
              }

              if (remainingFirstValues - 1 === 0) {
                observer.next?.(values.filter((documentSnapshot) => !!documentSnapshot) as DocumentSnapshot[]);
              } else {
                --remainingFirstValues;
              }
            },
            error: (documentSnapshotError) => {

              i = documents.length;

              setTimeout(() => {
                unsubscribeDocumentSnapshotsUnsubscribes();
                observer.error?.(documentSnapshotError);
              });
            }
          };

          const documentSnapshotsUnsubscribe = Document.snapshots(documents[i].documentReference, innerObserver);
          documentSnapshotsUnsubscribes.push(documentSnapshotsUnsubscribe);
        }
      },
      error: (error) => observer.error?.(error)
    });
  }
}
