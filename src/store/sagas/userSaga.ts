import { call, put, takeLatest, all } from 'redux-saga/effects';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  fetchUsersRequest,
  fetchUsersSuccess,
  fetchUsersFailure,
  User,
} from '../slices/userSlice';

function* handleFetchUsers(): any {
  try {
    // Note: If falling back from orderBy if index doesn't exist, we just getDocs(collection(db, 'users'))
    const q = query(collection(db, 'users')); 
    // We will do client-side sorting if needed or rely on Firestore default return order
    // as indexing 'createdAt' might not exist on 'users' collection yet if not created in Firebase console.
    const querySnapshot = yield call(getDocs, q);
    const users: User[] = [];
    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      users.push({ 
        id: doc.id, 
        ...data,
        name: data.displayName || data.name || '',
      } as User);
    });
    yield put(fetchUsersSuccess(users));
  } catch (error: any) {
    console.error('Saga: Error fetching users', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

export function* watchUsers() {
  yield takeLatest(fetchUsersRequest.type, handleFetchUsers);
}

export function* userSaga() {
  yield all([watchUsers()]);
}
