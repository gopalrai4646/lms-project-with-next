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
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  fetchCoursesRequest, 
  fetchCoursesSuccess, 
  fetchCoursesFailure,
  createCourseRequest,
  createCourseSuccess,
  updateCourseRequest,
  updateCourseSuccess,
  deleteCourseRequest,
  deleteCourseSuccess,
  Course
} from '../slices/courseSlice';

function* handleFetchCourses(): any {
  try {
    const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    const querySnapshot = yield call(getDocs, q);
    const courses: Course[] = [];
    querySnapshot.forEach((doc: any) => {
      courses.push({ id: doc.id, ...doc.data() });
    });
    yield put(fetchCoursesSuccess(courses));
  } catch (error: any) {
    yield put(fetchCoursesFailure(error.message));
  }
}

function* handleCreateCourse(action: ReturnType<typeof createCourseRequest>): any {
  try {
    const courseData = {
      ...action.payload,
      createdAt: serverTimestamp(),
    };
    const docRef = yield call(addDoc, collection(db, 'courses'), courseData);
    yield put(createCourseSuccess({ 
      id: docRef.id, 
      ...action.payload, 
      createdAt: new Date().toISOString() 
    }));
  } catch (error: any) {
    yield put(fetchCoursesFailure(error.message));
  }
}

function* handleUpdateCourse(action: ReturnType<typeof updateCourseRequest>): any {
  try {
    const { id, ...updates } = action.payload;
    const courseRef = doc(db, 'courses', id);
    // Use type assertion to bypass strict updateDoc overload check if needed
    yield call(updateDoc, courseRef as any, updates as any);
    yield put(updateCourseSuccess({ ...action.payload } as Course));
  } catch (error: any) {
    yield put(fetchCoursesFailure(error.message));
  }
}

function* handleDeleteCourse(action: ReturnType<typeof deleteCourseRequest>): any {
  try {
    const id = action.payload;
    yield call(deleteDoc, doc(db, 'courses', id));
    yield put(deleteCourseSuccess(id));
  } catch (error: any) {
    yield put(fetchCoursesFailure(error.message));
  }
}

export function* watchCourses() {
  yield takeLatest(fetchCoursesRequest.type, handleFetchCourses);
  yield takeLatest(createCourseRequest.type, handleCreateCourse);
  yield takeLatest(updateCourseRequest.type, handleUpdateCourse);
  yield takeLatest(deleteCourseRequest.type, handleDeleteCourse);
}

export function* courseSaga() {
  yield all([watchCourses()]);
}
