import { call, put, takeLatest, takeEvery } from 'redux-saga/effects';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  fetchProgressRequest,
  fetchProgressSuccess,
  fetchProgressFailure,
  updateProgressRequest,
  updateRatingRequest,
  updateLocalRating,
  updateLocalProgress,
  UserProgress
} from '../slices/progressSlice';

function* handleUpdateRating(action: ReturnType<typeof updateRatingRequest>): any {
  try {
    const { userId, courseId, rating } = action.payload;
    
    // Update local state first
    yield put(updateLocalRating({ courseId, rating }));

    const progressRef = doc(db, 'userProgress', `${userId}_${courseId}`);
    
    // Ensure document exists
    yield call((ref: any, data: any, options: any) => setDoc(ref, data, options), progressRef, { courseId }, { merge: true });

    // Update rating and isRated fields
    const updates = {
      rating,
      isRated: true,
      lastUpdated: new Date().toISOString(),
    };

    yield call((ref: any, data: any) => updateDoc(ref, data), progressRef, updates);
  } catch (error: any) {
    console.error('Saga: Error updating rating:', error);
  }
}

function* handleFetchProgress(action: ReturnType<typeof fetchProgressRequest>): any {
  try {
    const { userId, courseId } = action.payload;
    const progressRef = doc(db, 'userProgress', `${userId}_${courseId}`);
    const progressSnap = yield call(getDoc, progressRef);

    if (progressSnap.exists()) {
      yield put(fetchProgressSuccess(progressSnap.data() as UserProgress));
    } else {
      // Initialize empty progress
      const initialProgress: UserProgress = {
        courseId,
        watchedDurations: {},
        completedVideos: [],
        lastUpdated: new Date().toISOString(),
      };
      yield put(fetchProgressSuccess(initialProgress));
    }
  } catch (error: any) {
    yield put(fetchProgressFailure(error.message));
  }
}

function* handleUpdateProgress(action: ReturnType<typeof updateProgressRequest>): any {
  try {
    const { userId, courseId, videoId, watchedDuration, isCompleted } = action.payload;
    
    // First update local state for immediate UI feedback
    yield put(updateLocalProgress({ courseId, videoId, watchedDuration, isCompleted }));

    const progressRef = doc(db, 'userProgress', `${userId}_${courseId}`);
    
    // 1. Ensure the document exists first (required for updateDoc)
    yield call((ref: any, data: any, options: any) => setDoc(ref, data, options), progressRef, { courseId }, { merge: true });

    // 2. Use updateDoc with dotted notation for correct nested map updates
    const today = new Date().toISOString().split('T')[0];
    const updates: any = {
      [`watchedDurations.${videoId}`]: watchedDuration,
      [`dailyActivity.${today}`]: arrayUnion(videoId),
      lastUpdated: new Date().toISOString(),
    };

    if (isCompleted) {
      updates.completedVideos = arrayUnion(videoId);
    }

    yield call((ref: any, data: any) => updateDoc(ref, data), progressRef, updates);
  } catch (error: any) {
    console.error('Saga: Error updating progress:', error);
  }
}

export default function* progressSaga() {
  yield takeLatest(fetchProgressRequest.type, handleFetchProgress);
  yield takeLatest(updateRatingRequest.type, handleUpdateRating);
  // use takeEvery or a manual buffer for progress updates to avoid dropping intermediate states
  yield takeEvery(updateProgressRequest.type, handleUpdateProgress);
}
