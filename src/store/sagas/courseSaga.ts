import { call, put, takeLatest, all } from 'redux-saga/effects';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { extractPublicIdFromUrl } from '@/utils/cloudinary-utils';
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

    // 1. Fetch course details to get Cloudinary URLs
    console.log(`Saga: Fetching course details for deletion: ${id}`);
    const courseRef = doc(db, 'courses', id);
    const courseSnap: any = yield call(getDoc, courseRef);

    if (courseSnap.exists()) {
      const courseData = courseSnap.data();
      const assetsToDelete: { publicId: string; resourceType: string }[] = [];

      // Extract thumbnail public ID
      if (courseData.thumbnail) {
        const thumbPublicId = extractPublicIdFromUrl(courseData.thumbnail);
        if (thumbPublicId) {
          assetsToDelete.push({ publicId: thumbPublicId, resourceType: 'image' });
        }
      }

      // Extract video public IDs from videos array
      if (courseData.videos && Array.isArray(courseData.videos)) {
        for (const video of courseData.videos) {
          if (video.url) {
            const videoPublicId = extractPublicIdFromUrl(video.url);
            if (videoPublicId) {
              assetsToDelete.push({ publicId: videoPublicId, resourceType: 'video' });
            }
          }
        }
      }

      // Fallback: single videoUrl (legacy courses)
      if (courseData.videoUrl && (!courseData.videos || courseData.videos.length === 0)) {
        const videoPublicId = extractPublicIdFromUrl(courseData.videoUrl);
        if (videoPublicId) {
          assetsToDelete.push({ publicId: videoPublicId, resourceType: 'video' });
        }
      }

      // 2. Delete assets from Cloudinary via API route
      for (const asset of assetsToDelete) {
        try {
          console.log(`Saga: Attempting to delete Cloudinary asset: ${asset.publicId}`);
          yield call(fetch, '/api/cloudinary/delete', {
            method: 'POST',
            body: JSON.stringify(asset),
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (error) {
          console.error(`Saga: Failed to delete Cloudinary asset ${asset.publicId}:`, error);
          // Continue with course deletion even if some assets fail
        }
      }
    }

    // 3. Delete course document from Firestore
    console.log(`Saga: Deleting course document from Firestore: ${id}`);
    yield call(deleteDoc, courseRef);
    yield put(deleteCourseSuccess(id));

  } catch (error: any) {
    console.error(`Saga: Error in handleDeleteCourse:`, error.message);
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
