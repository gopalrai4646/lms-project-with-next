import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUid = searchParams.get('uid');
    const authHeader = request.headers.get('Authorization');

    if (!targetUid) {
      return NextResponse.json({ error: 'Target UID is required' }, { status: 400 });
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
      if (roleData && roleData.permissions && hasPermission(roleData.permissions, 'users_impersonate')) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to impersonate users' }, { status: 403 });
    }

    // 3. Fetch the target user's data securely
    const targetDoc = await adminDb.collection('users').doc(targetUid).get();
    if (!targetDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetData = targetDoc.data();

    return NextResponse.json({ 
      success: true, 
      user: {
        uid: targetUid,
        email: targetData?.email || null,
        displayName: targetData?.displayName || null,
        enrolledCourses: targetData?.enrolledCourses || [],
        savedCourses: targetData?.savedCourses || [],
        assignedTrainingPlans: targetData?.assignedTrainingPlans || [],
        photoURL: targetData?.photoURL || null,
        phoneNumber: targetData?.phoneNumber || null,
      },
      role: targetData?.role || 'student'
    });
  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
