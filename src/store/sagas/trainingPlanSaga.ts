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
  onSnapshot
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
    const q = query(collection(db, 'trainingPlans'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const plans: TrainingPlan[] = [];
      snapshot.forEach((doc: any) => {
        plans.push({ id: doc.id, ...doc.data() });
      });
      emit(plans);
    }, (error) => {
      console.error("Training plans listener error:", error);
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
    const planRef = doc(db, 'trainingPlans', id);
    yield call(deleteDoc, planRef);
    yield put(deleteTrainingPlanSuccess(id));
  } catch (error: any) {
    yield put(fetchTrainingPlansFailure(error.message));
  }
}

export function* watchTrainingPlans() {
  yield takeLatest(fetchTrainingPlansRequest.type, handleFetchTrainingPlans);
  yield takeLatest(createTrainingPlanRequest.type, handleCreateTrainingPlan);
  yield takeLatest(updateTrainingPlanRequest.type, handleUpdateTrainingPlan);
  yield takeLatest(deleteTrainingPlanRequest.type, handleDeleteTrainingPlan);
}

export function* trainingPlanSaga() {
  yield all([watchTrainingPlans()]);
}
