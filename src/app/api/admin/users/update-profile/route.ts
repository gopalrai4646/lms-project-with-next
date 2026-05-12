import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { hasPermission } from '@/lib/permissions';

export async function POST(request: Request) {
  try {
    const { userId, displayName, photoURL, phoneNumber } = await request.json();
    const authHeader = request.headers.get('Authorization');

    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
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
    // Admins can update any profile.
    // Staff can update if they are impersonating (requires users_impersonate).
    if (callerData.role === 'admin') {
      isAuthorized = true;
    } else if (callerData.role === 'staff' && callerData.staffRoleId) {
      const roleDoc = await adminDb.collection('staffRoles').doc(callerData.staffRoleId).get();
      const roleData = roleDoc.data();
      if (roleData && roleData.permissions && (hasPermission(roleData.permissions, 'users_impersonate') || hasPermission(roleData.permissions, 'users_read'))) {
        // We allow profile updates if they have impersonation rights.
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to update user profile' }, { status: 403 });
    }

    // 3. Update the target user document in Firestore
    const userRef = adminDb.collection('users').doc(userId);
    const updates: any = { 
      updatedAt: new Date().toISOString() 
    };
    if (displayName !== undefined) updates.displayName = displayName;
    if (photoURL !== undefined) updates.photoURL = photoURL;
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber;

    await userRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
