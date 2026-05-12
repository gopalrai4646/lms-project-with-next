import { call, put, takeLatest, all, take, fork } from 'redux-saga/effects';
import { getAuth } from 'firebase/auth';
import { collection, query, deleteDoc, doc, updateDoc, setDoc, getDoc, arrayUnion, arrayRemove, onSnapshot, getDocs, where, writeBatch } from 'firebase/firestore';
import { eventChannel } from 'redux-saga';
import { db } from '@/lib/firebase/config';
import {
  fetchUsersRequest,
  fetchUsersSuccess,
  fetchUsersFailure,
  User,
  deleteUserRequest,
  deleteUserSuccess,
  enrollUserRequest,
  enrollUserSuccess,
  unenrollUserRequest,
  unenrollUserSuccess,
  assignTrainingPlanRequest,
  assignTrainingPlanSuccess,
  unassignTrainingPlanRequest,
  unassignTrainingPlanSuccess,
} from '../slices/userSlice';
import { assignTrainingPlanToUser, unassignTrainingPlanFromUser } from '../slices/authSlice';

function createUsersChannel() {
  return eventChannel(emit => {
    const q = query(collection(db, 'users'));
    return onSnapshot(q, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        users.push({ 
          id: doc.id, 
          ...data,
          name: data.displayName || data.name || '',
        } as User);
      });
      emit(users);
    }, (error: any) => {
      if (error.code === 'permission-denied') {
        console.debug("Users listener disconnected (permission-denied). Normal during logout.");
      } else {
        console.error("Users listener error:", error);
      }
    });
  });
}

function* handleFetchUsers(): any {
  const channel = yield call(createUsersChannel);
  try {
    while (true) {
      const users = yield take(channel);
      yield put(fetchUsersSuccess(users));
    }
  } catch (error: any) {
    yield put(fetchUsersFailure(error.message));
  } finally {
    channel.close();
  }
}

function* handleDeleteUser(action: ReturnType<typeof deleteUserRequest>): any {
  try {
    const userId = action.payload;
    const auth = getAuth();
    const token = yield call([auth.currentUser!, auth.currentUser!.getIdToken]);

    if (!token) {
      throw new Error('Not authenticated');
    }

    // 1. Delete user via API (Handles Auth deletion, Blacklisting, and Firestore deletion)
    console.log(`Saga: Calling Auth deletion API for user: ${userId}`);
    const authResponse = yield call(fetch, '/api/admin/users/delete', {
      method: 'POST',
      body: JSON.stringify({ uid: userId }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!authResponse.ok) {
      const errorData = yield call([authResponse, authResponse.json]);
      throw new Error(errorData.error || 'Failed to delete user');
    }

    yield put(deleteUserSuccess(userId));
  } catch (error: any) {
    console.error('Saga: Error deleting user', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleEnrollUser(action: ReturnType<typeof enrollUserRequest>): any {
  try {
    const { userId, courseId } = action.payload;
    const auth = getAuth();
    const token = yield call([auth.currentUser!, auth.currentUser!.getIdToken]);

    if (!token) throw new Error('Not authenticated');

    const response = yield call(fetch, '/api/admin/users/enroll-course', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId, action: 'enroll' }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = yield call([response, response.json]);
      throw new Error(errorData.error || 'Failed to enroll user');
    }

    yield put(enrollUserSuccess({ userId, courseId }));
  } catch (error: any) {
    console.error('Saga: Error enrolling user', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleUnenrollUser(action: ReturnType<typeof unenrollUserRequest>): any {
  try {
    const { userId, courseId } = action.payload;
    const auth = getAuth();
    const token = yield call([auth.currentUser!, auth.currentUser!.getIdToken]);

    if (!token) throw new Error('Not authenticated');

    const response = yield call(fetch, '/api/admin/users/enroll-course', {
      method: 'POST',
      body: JSON.stringify({ userId, courseId, action: 'unenroll' }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = yield call([response, response.json]);
      throw new Error(errorData.error || 'Failed to unenroll user');
    }

    yield put(unenrollUserSuccess({ userId, courseId }));
  } catch (error: any) {
    console.error('Saga: Error unenrolling user', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleAssignTrainingPlan(action: ReturnType<typeof assignTrainingPlanRequest>): any {
  try {
    const { userId, trainingPlanIds } = action.payload;
    const auth = getAuth();
    const token = yield call([auth.currentUser!, auth.currentUser!.getIdToken]);

    if (!token) throw new Error('Not authenticated');

    const response = yield call(fetch, '/api/admin/users/assign-plan', {
      method: 'POST',
      body: JSON.stringify({ userId, trainingPlanIds, action: 'assign' }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = yield call([response, response.json]);
      throw new Error(errorData.error || 'Failed to assign training plan');
    }

    yield put(assignTrainingPlanSuccess({ userId, trainingPlanIds }));
    
    // Also update the auth state if we are currently impersonating this user
    if (action === 'assign') {
      yield put(assignTrainingPlanToUser({ userId, trainingPlanIds }));
    } else {
      yield put(unassignTrainingPlanFromUser({ userId, trainingPlanIds }));
    }
  } catch (error: any) {
    console.error('Saga: Error assigning training plan', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleUnassignTrainingPlan(action: ReturnType<typeof unassignTrainingPlanRequest>): any {
  try {
    const { userId, trainingPlanId } = action.payload;
    const auth = getAuth();
    const token = yield call([auth.currentUser!, auth.currentUser!.getIdToken]);

    if (!token) throw new Error('Not authenticated');

    const response = yield call(fetch, '/api/admin/users/assign-plan', {
      method: 'POST',
      body: JSON.stringify({ userId, trainingPlanIds: [trainingPlanId], action: 'unassign' }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = yield call([response, response.json]);
      throw new Error(errorData.error || 'Failed to unassign training plan');
    }

    yield put(unassignTrainingPlanSuccess({ userId, trainingPlanId }));
  } catch (error: any) {
    console.error('Saga: Error unassigning training plan', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

export function* watchUsers() {
  // Use takeLatest for the persistent listener so every request ensures a response
  yield takeLatest(fetchUsersRequest.type, handleFetchUsers);

  yield takeLatest(deleteUserRequest.type, handleDeleteUser);
  yield takeLatest(enrollUserRequest.type, handleEnrollUser);
  yield takeLatest(unenrollUserRequest.type, handleUnenrollUser);
  yield takeLatest(assignTrainingPlanRequest.type, handleAssignTrainingPlan);
  yield takeLatest(unassignTrainingPlanRequest.type, handleUnassignTrainingPlan);
}

export function* userSaga() {
  yield all([watchUsers()]);
}
