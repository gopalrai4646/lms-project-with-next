import { call, put, takeLatest, all, take, fork } from 'redux-saga/effects';
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
  assignTrainingPlanRequest,
  assignTrainingPlanSuccess,
  unassignTrainingPlanRequest,
  unassignTrainingPlanSuccess,
} from '../slices/userSlice';

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

    // 0. Get user email before deletion for the blacklist
    const userDoc: any = yield call(getDoc, doc(db, 'users', userId));
    let userEmail = '';
    if (userDoc.exists()) {
      userEmail = userDoc.data().email?.toLowerCase();
    }

    // 1. Delete from Firebase Authentication via API
    console.log(`Saga: Calling Auth deletion API for user: ${userId}`);
    const authResponse = yield call(fetch, '/api/admin/users/delete', {
      method: 'POST',
      body: JSON.stringify({ uid: userId }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!authResponse.ok) {
      const errorData = yield call([authResponse, authResponse.json]);
      throw new Error(errorData.error || 'Failed to delete user from Authentication');
    }

    // 2. Add email to bannedEmails collection for permanent ban
    if (userEmail) {
      console.log(`Saga: Blacklisting email: ${userEmail}`);
      const bannedRef = doc(db, 'bannedEmails', userEmail);
      yield call(() => setDoc(bannedRef, { 
        email: userEmail, 
        bannedAt: new Date().toISOString() 
      }));
    }

    // 2. Delete from Firestore
    console.log(`Saga: Deleting user document from Firestore: ${userId}`);
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
    yield call(() => updateDoc(userRef as any, {
      assignedTrainingPlans: arrayUnion(...trainingPlanIds),
    } as any));
    yield put(assignTrainingPlanSuccess({ userId, trainingPlanIds }));
  } catch (error: any) {
    console.error('Saga: Error assigning training plan', error.message);
    yield put(fetchUsersFailure(error.message));
  }
}

function* handleUnassignTrainingPlan(action: ReturnType<typeof unassignTrainingPlanRequest>): any {
  try {
    const { userId, trainingPlanId } = action.payload;
    const userRef = doc(db, 'users', userId);
    yield call(() => updateDoc(userRef as any, {
      assignedTrainingPlans: arrayRemove(trainingPlanId),
    } as any));
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
  yield takeLatest(assignTrainingPlanRequest.type, handleAssignTrainingPlan);
  yield takeLatest(unassignTrainingPlanRequest.type, handleUnassignTrainingPlan);
}

export function* userSaga() {
  yield all([watchUsers()]);
}
