import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { hasPermission } from '@/lib/permissions';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { userId, courseId, action } = await request.json(); // action: 'enroll' | 'unenroll'
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
    if (callerData.role === 'admin') {
      isAuthorized = true;
    } else if (callerData.role === 'staff' && callerData.staffRoleId) {
      const roleDoc = await adminDb.collection('staffRoles').doc(callerData.staffRoleId).get();
      const roleData = roleDoc.data();
      if (roleData && roleData.permissions) {
        const permissions = roleData.permissions;
        if (hasPermission(permissions, 'users_impersonate')) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to manage course enrollments' }, { status: 403 });
    }

    // 3. Update the target user and the course enrolledUsers list
    const userRef = adminDb.collection('users').doc(userId);
    const courseRef = adminDb.collection('courses').doc(courseId);
    
    const batch = adminDb.batch();

    if (action === 'unenroll') {
      batch.update(userRef, {
        enrolledCourses: admin.firestore.FieldValue.arrayRemove(courseId)
      });
      batch.update(courseRef, {
        enrolledUsers: admin.firestore.FieldValue.arrayRemove(userId)
      });
    } else {
      batch.update(userRef, {
        enrolledCourses: admin.firestore.FieldValue.arrayUnion(courseId)
      });
      batch.update(courseRef, {
        enrolledUsers: admin.firestore.FieldValue.arrayUnion(userId)
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
