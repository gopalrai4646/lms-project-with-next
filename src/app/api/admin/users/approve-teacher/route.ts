import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Verify caller is admin or authorized staff
    const callerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const callerData = callerDoc.data();
    
    const isAdmin = callerData?.role === 'admin';
    let isAuthorizedStaff = false;

    if (callerData?.role === 'staff' && callerData.staffRoleId) {
      const roleDoc = await adminDb.collection('staffRoles').doc(callerData.staffRoleId).get();
      const roleData = roleDoc.data();
      if (roleData && Array.isArray(roleData.permissions) && roleData.permissions.includes('teachers_approve')) {
        isAuthorizedStaff = true;
      }
    }

    if (!callerDoc.exists || (!isAdmin && !isAuthorizedStaff)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Update status to 'approved'
    await adminDb.collection('users').doc(userId).update({
      status: 'approved',
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Approve teacher error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
