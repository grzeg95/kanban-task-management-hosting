import {CollectionReference} from '@angular/fire/firestore';
import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  collectionData as _collectionData,
  onSnapshot as _onSnapshot,
  query,
  Query,
  QueryConstraint,
  QuerySnapshot,
  updateDoc as _updateDoc,
} from '@angular/fire/firestore';
import {UpdateData} from '@firebase/firestore';
import {defer, Observable} from 'rxjs';

export function updateDoc<AppModelType, DbModelType extends DocumentData>(reference: DocumentReference<AppModelType, DbModelType>, data: UpdateData<DbModelType>) {
  return defer(() => _updateDoc(reference, data));
}

export function collectionData<AppModelType, DbModelType extends DocumentData>(reference: CollectionReference<AppModelType, DbModelType>, ...queryConstraints: QueryConstraint[]) {
  return defer(() => _collectionData(query<AppModelType, DbModelType>(reference, ...queryConstraints)));
}

export function docOnSnapshot<AppModelType, DbModelType extends DocumentData>(ref: DocumentReference<AppModelType, DbModelType>) {
  return fromRef<AppModelType, DbModelType>(ref);
}

export function collectionOnSnapshot<AppModelType, DbModelType extends DocumentData>(ref: CollectionReference<AppModelType, DbModelType>, ...queryConstraints: QueryConstraint[]) {
  return fromRef(query<AppModelType, DbModelType>(ref, ...queryConstraints));
}

function fromRef<AppModelType, DbModelType extends DocumentData>(ref: DocumentReference<AppModelType, DbModelType>): Observable<DocumentSnapshot<AppModelType, DbModelType>>;
function fromRef<AppModelType, DbModelType extends DocumentData>(query: Query<AppModelType, DbModelType>): Observable<QuerySnapshot<AppModelType, DbModelType>>;
function fromRef<AppModelType, DbModelType extends DocumentData>(refOrQuery: DocumentReference<AppModelType, DbModelType> | Query<AppModelType, DbModelType>){

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
