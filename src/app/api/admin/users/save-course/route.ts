import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { hasPermission } from '@/lib/permissions';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { userId, courseId, action } = await request.json(); // action: 'save' | 'unsave'
    const authHeader = request.headers.get('Authorization');

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'UserId and courseId are required' }, { status: 400 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // 1. Verify the caller
    const decodedToken = await adminAuth.verifyIdToken(token);
    const callerUid = decodedToken.uid;

    // 2. Check caller permissions
    const callerDoc = await adminDb.collection('users').doc(callerUid).get();
    const callerData = callerDoc.data();

    if (!callerData) {
      return NextResponse.json({ error: 'Unauthorized: User not found' }, { status: 403 });
    }

    let isAuthorized = false;
    // Admins and staff can always save/unsave courses for users they are impersonating
    // Note: We don't necessarily need a specific "save_course" permission if they are already 
    // allowed to impersonate, but for consistency we check if they are admin or staff.
    if (callerData.role === 'admin' || callerData.role === 'staff') {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // 3. Update the target user's savedCourses
    const userRef = adminDb.collection('users').doc(userId);
    
    if (action === 'unsave') {
      await userRef.update({
        savedCourses: admin.firestore.FieldValue.arrayRemove(courseId)
      });
    } else {
      await userRef.update({
        savedCourses: admin.firestore.FieldValue.arrayUnion(courseId)
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
