import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  onSnapshot as _onSnapshot,
  Query,
  query,
  QueryConstraint,
  QuerySnapshot,
  UpdateData,
  updateDoc as _updateDoc,
} from '@angular/fire/firestore';
export {doc, getDoc} from '@angular/fire/firestore';
import {defer, Observable} from 'rxjs';

export function docSnapshots<AppModelType, DbModelType extends DocumentData>(reference: DocumentReference<AppModelType, DbModelType>) {
  return fromRef(reference);
}

export function updateDoc<AppModelType, DbModelType extends DocumentData>(reference: DocumentReference<AppModelType, DbModelType>, data: UpdateData<DbModelType>) {
  return defer(() => _updateDoc(reference, data));
}

export function collectionSnapshots<AppModelType, DbModelType extends DocumentData>(reference: CollectionReference<AppModelType, DbModelType>, ...queryConstraints: QueryConstraint[]) {
  return fromRef(query(reference, ...queryConstraints));
}

function fromRef<AppModelType, DbModelType extends DocumentData>(reference: DocumentReference<AppModelType, DbModelType>): Observable<DocumentSnapshot<AppModelType, DbModelType>>;
function fromRef<AppModelType, DbModelType extends DocumentData>(query: Query<AppModelType, DbModelType>): Observable<QuerySnapshot<AppModelType, DbModelType>>;
function fromRef<AppModelType, DbModelType extends DocumentData>(refOrQuery: DocumentReference<AppModelType, DbModelType> | Query<AppModelType, DbModelType>) {

  let ref: DocumentReference<AppModelType, DbModelType>;
  let query: Query<AppModelType, DbModelType>;

  if (refOrQuery instanceof DocumentReference) {
    ref = refOrQuery;
  } else {
    query = refOrQuery;
  }

  return new Observable((subscriber) => {
    const unsubscribe = _onSnapshot(ref || query, {includeMetadataChanges: true}, {
      next: subscriber.next.bind(subscriber),
      error: subscriber.error.bind(subscriber),
      complete: subscriber.complete.bind(subscriber),
    });
    return {unsubscribe};
  });
}
