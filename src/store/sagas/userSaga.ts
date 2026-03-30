import { call, put, takeLatest, all } from 'redux-saga/effects';
import { collection, getDocs, query, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  fetchUsersRequest,
  fetchUsersSuccess,
  fetchUsersFailure,
  User,
  deleteUserRequest,
  deleteUserSuccess,
  assignTrainingPlanRequest,
  assignTrainingPlanSuccess,
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
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleDeleteUser(action: ReturnType<typeof deleteUserRequest>): any {
  try {
    const userId = action.payload;
    const userRef = doc(db, 'users', userId);
    yield call(deleteDoc, userRef);
    yield put(deleteUserSuccess(userId));
  } catch (error: any) {
    console.error('Saga: Error deleting user', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleAssignTrainingPlan(action: ReturnType<typeof assignTrainingPlanRequest>): any {
  try {
    const { userId, trainingPlanIds } = action.payload;
    const userRef = doc(db, 'users', userId);
    yield call(updateDoc, userRef as any, {
      assignedTrainingPlans: arrayUnion(...trainingPlanIds),
    } as any);
    yield put(assignTrainingPlanSuccess({ userId, trainingPlanIds }));
  } catch (error: any) {
    console.error('Saga: Error assigning training plan', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

export function* watchUsers() {
  yield takeLatest(fetchUsersRequest.type, handleFetchUsers);
  yield takeLatest(deleteUserRequest.type, handleDeleteUser);
  yield takeLatest(assignTrainingPlanRequest.type, handleAssignTrainingPlan);
}

export function* userSaga() {
  yield all([watchUsers()]);
}
