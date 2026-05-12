import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { hasPermission } from '@/lib/permissions';

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();
    const authHeader = request.headers.get('Authorization');

    if (!uid) {
      return NextResponse.json({ error: 'Target UID is required' }, { status: 400 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // 1. Verify the caller
    const decodedToken = await adminAuth.verifyIdToken(token);
    const callerUid = decodedToken.uid;

    // 2. Check caller permissions in Firestore
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
      if (roleData && roleData.permissions && hasPermission(roleData.permissions, 'users_delete')) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to delete users' }, { status: 403 });
    }

    console.log(`API: Authorized deletion of user ${uid} by ${callerUid}`);

    // 3. Get target user email for blacklisting before deletion
    const targetDoc = await adminDb.collection('users').doc(uid).get();
    const targetData = targetDoc.data();
    const targetEmail = targetData?.email?.toLowerCase();

    // 4. Delete from Firebase Authentication
    try {
      await adminAuth.deleteUser(uid);
      console.log(`API: Successfully deleted user from Auth: ${uid}`);
    } catch (authError: any) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
      console.log(`API: User ${uid} already removed from Auth`);
    }

    // 5. Add to bannedEmails
    if (targetEmail) {
      await adminDb.collection('bannedEmails').doc(targetEmail).set({
        email: targetEmail,
        bannedAt: new Date().toISOString(),
        deletedBy: callerUid
      });
      console.log(`API: Blacklisted email: ${targetEmail}`);
    }

    // 6. Delete from Firestore users collection
    await adminDb.collection('users').doc(uid).delete();
    console.log(`API: Deleted user document from Firestore: ${uid}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
