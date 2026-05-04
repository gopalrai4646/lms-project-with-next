import { call, put, takeLatest, all } from 'redux-saga/effects';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  where,
  writeBatch,
  arrayRemove
} from 'firebase/firestore';
import { eventChannel } from 'redux-saga';
import { take, fork, cancel } from 'redux-saga/effects';
import { db } from '@/lib/firebase/config';
import {
  fetchTrainingPlansRequest,
  fetchTrainingPlansSuccess,
  fetchTrainingPlansFailure,
  createTrainingPlanRequest,
  createTrainingPlanSuccess,
  updateTrainingPlanRequest,
  updateTrainingPlanSuccess,
  deleteTrainingPlanRequest,
  deleteTrainingPlanSuccess,
  TrainingPlan,
} from '../slices/trainingPlanSlice';

function createTrainingPlansChannel() {
  return eventChannel(emit => {
    const q = query(collection(db, 'trainingPlans'));
    return onSnapshot(q, (snapshot) => {
      const plans: TrainingPlan[] = [];
      snapshot.forEach((doc: any) => {
        plans.push({ id: doc.id, ...doc.data() });
      });
      emit(plans);
    }, (error: any) => {
      if (error.code === 'permission-denied') {
        console.debug("Training plans listener disconnected (permission-denied). Normal during logout.");
      } else {
        console.error("Training plans listener error:", error);
      }
    });
  });
}

function* handleFetchTrainingPlans(): any {
  const channel = yield call(createTrainingPlansChannel);
  try {
    while (true) {
      const plans = yield take(channel);
      yield put(fetchTrainingPlansSuccess(plans));
    }
  } catch (error: any) {
    yield put(fetchTrainingPlansFailure(error.message));
  } finally {
    channel.close();
  }
}

function* handleCreateTrainingPlan(action: ReturnType<typeof createTrainingPlanRequest>): any {
  try {
    const planData = {
      ...action.payload,
      createdAt: serverTimestamp(),
    };
    const docRef = yield call(addDoc, collection(db, 'trainingPlans'), planData);
    yield put(createTrainingPlanSuccess({
      id: docRef.id,
      ...action.payload,
      createdAt: new Date().toISOString(),
    }));
  } catch (error: any) {
    yield put(fetchTrainingPlansFailure(error.message));
  }
}

function* handleUpdateTrainingPlan(action: ReturnType<typeof updateTrainingPlanRequest>): any {
  try {
    const { id, ...updates } = action.payload;
    const planRef = doc(db, 'trainingPlans', id);
    // Fixing the call to updateDoc to handle overload resolution correctly
    yield call(() => updateDoc(planRef, updates as any));
    yield put(updateTrainingPlanSuccess({ ...action.payload } as TrainingPlan));
  } catch (error: any) {
    yield put(fetchTrainingPlansFailure(error.message));
  }
}

function* handleDeleteTrainingPlan(action: ReturnType<typeof deleteTrainingPlanRequest>): any {
  try {
    const id = action.payload;
    
    // 1. Delete the training plan itself
    const planRef = doc(db, 'trainingPlans', id);
    yield call(deleteDoc, planRef);

    // 2. Automatically Remove from all users' assigned lists
    // We find all users who have this ID in their assignedTrainingPlans array
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('assignedTrainingPlans', 'array-contains', id));
    const querySnapshot = yield call(getDocs, q);
    
    if (!querySnapshot.empty) {
      const batch = writeBatch(db);
      querySnapshot.forEach((userDoc: any) => {
        batch.update(userDoc.ref, {
          assignedTrainingPlans: arrayRemove(id)
        });
      });
      yield call([batch, batch.commit]);
      console.log(`Cleaned up deleted training plan ${id} from ${querySnapshot.size} users.`);
    }

    yield put(deleteTrainingPlanSuccess(id));
  } catch (error: any) {
    yield put(fetchTrainingPlansFailure(error.message));
  }
}

export function* watchTrainingPlans() {
  // Use takeLatest for the persistent listener so every request ensures a response
  yield takeLatest(fetchTrainingPlansRequest.type, handleFetchTrainingPlans);

  yield takeLatest(createTrainingPlanRequest.type, handleCreateTrainingPlan);
  yield takeLatest(updateTrainingPlanRequest.type, handleUpdateTrainingPlan);
  yield takeLatest(deleteTrainingPlanRequest.type, handleDeleteTrainingPlan);
}

export function* trainingPlanSaga() {
  yield all([watchTrainingPlans()]);
}
