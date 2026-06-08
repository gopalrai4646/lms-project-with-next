import { call, put, select, takeLatest } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import {
  initiatePaymentRequest,
  paymentSuccess,
  paymentFailure,
} from '../slices/paymentSlice';
import { enrollCourseSuccess } from '../slices/authSlice';
import { RootState } from '../index';
import { db, auth } from '@/lib/firebase/config';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import CryptoJS from 'crypto-js';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function* handleInitiatePayment(
  action: PayloadAction<{ courseId: string; amount: number }>
): any {
  try {
    const { courseId, amount } = action.payload;
    const authState = (yield select((state: RootState) => state.auth)) as any;
    const user = authState.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    if (amount === 0) {
      // 0. Free course bypass Razorpay completely
      const purchaseData = {
        courseId,
        purchaseDate: new Date().toISOString(),
        amountPaid: 0,
        razorpayPaymentId: 'FREE_COURSE',
        razorpayOrderId: 'FREE_COURSE',
      };

      const userRef = doc(db, 'users', user.uid);
      yield call(async () => {
        await updateDoc(userRef, {
          purchasedCourses: arrayUnion(purchaseData),
          enrolledCourses: arrayUnion(courseId),
        });
        
        const courseRef = doc(db, 'courses', courseId);
        await setDoc(
          courseRef,
          { enrolledUsers: arrayUnion(user.uid) },
          { merge: true }
        );
      });

      yield put(paymentSuccess({ paymentId: 'FREE_COURSE' }));
      yield put(enrollCourseSuccess(courseId));
      return;
    }

    // 1. Create Order via Next.js Backend API
    const authRecord = (yield select((state: RootState) => state.auth)) as any;
    // We need Firebase token to authenticate API route
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Firebase user not found");
    const token = yield call([currentUser, currentUser.getIdToken]);

    const orderResponse = (yield call(fetch, '/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, courseId }),
    })) as Response;

    const orderData = (yield call([orderResponse, 'json'])) as any;

    if (!orderResponse.ok) {
      throw new Error(orderData.error || 'Failed to create order');
    }

    const orderId = orderData.id;

    // 2. Load Razorpay script
    const isLoaded = yield call(loadRazorpayScript);
    if (!isLoaded) {
      throw new Error('Razorpay SDK failed to load. Check your internet connection.');
    }

    // 3. Open Razorpay Web Checkout
    const paymentResponse = (yield call(() => new Promise((resolve, reject) => {
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: amount * 100,
        currency: 'INR',
        name: 'Mentora LMS',
        description: `Purchase Course ${courseId}`,
        order_id: orderId,
        handler: function (response: any) {
          resolve(response);
        },
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
        },
        theme: {
          color: '#4f46e5'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        reject(new Error(response.error.description));
      });
      rzp.open();
    }))) as any;

    // 4. Verify Signature Locally
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = paymentResponse;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    // Note: To be perfectly secure, signature verification should also happen on the backend.
    // However, since we are directly updating Firestore from the client which is protected by rules,
    // this mimics the React Native implementation logic.
    // We need the SECRET key to verify the signature. Since we don't want to expose SECRET key to client,
    // we should ideally verify on the backend. But wait, if we can't expose secret, how do we verify?
    // Let's call another API route to verify, or we can just send the success status directly since we trust Razorpay UI.
    // Actually, Razorpay handler is only called on success.
    // To strictly follow the plan, I will use a backend route to verify, OR just verify implicitly.
    // I'll create a verification API route next or just bypass verification here.
    // For now, I'll bypass the frontend signature check and rely on the fact that handler only fires on success,
    // but in production, we should hit a webhook or API route.
    // Wait, the plan says "Verifies the signature securely using crypto-js" which I wrote.
    // I will add a /api/razorpay/verify-signature route.

    const verifyResponse = (yield call(fetch, '/api/razorpay/verify-signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
    })) as Response;

    const verifyData = (yield call([verifyResponse, 'json'])) as any;
    if (!verifyResponse.ok || !verifyData.verified) {
        throw new Error('Payment signature verification failed');
    }

    // 5. Update Firestore directly
    const purchaseData = {
      courseId,
      purchaseDate: new Date().toISOString(),
      amountPaid: amount,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    };

    const userRef = doc(db, 'users', user.uid);
    yield call(async () => {
      await updateDoc(userRef, {
        purchasedCourses: arrayUnion(purchaseData),
        enrolledCourses: arrayUnion(courseId),
      });
      
      const courseRef = doc(db, 'courses', courseId);
      await setDoc(
        courseRef,
        { enrolledUsers: arrayUnion(user.uid) },
        { merge: true }
      );
    });

    // 6. Dispatch success
    yield put(paymentSuccess({ paymentId: razorpay_payment_id }));
    // 7. Instantly unlock the course in the UI!
    yield put(enrollCourseSuccess(courseId));
  } catch (error: any) {
    console.error('Payment Saga Error:', error);
    yield put(paymentFailure({ error: error.message || 'Payment failed' }));
  }
}

export function* paymentSaga() {
  yield takeLatest(initiatePaymentRequest.type, handleInitiatePayment);
}
