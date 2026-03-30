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
} from 'firebase/firestore';
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

function* handleFetchTrainingPlans(): any {
  try {
    const q = query(collection(db, 'trainingPlans'), orderBy('createdAt', 'desc'));
    const querySnapshot = yield call(getDocs, q);
    const plans: TrainingPlan[] = [];
    querySnapshot.forEach((doc: any) => {
      plans.push({ id: doc.id, ...doc.data() });
    });
    yield put(fetchTrainingPlansSuccess(plans));
  } catch (error: any) {
    yield put(fetchTrainingPlansFailure(error.message));
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
    yield call(updateDoc, planRef as any, updates as any);
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
