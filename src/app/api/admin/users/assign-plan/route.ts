import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { hasPermission } from '@/lib/permissions';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { userId, trainingPlanIds, action } = await request.json(); // action: 'assign' | 'unassign'
    const authHeader = request.headers.get('Authorization');

    if (!userId || !trainingPlanIds || !Array.isArray(trainingPlanIds)) {
      return NextResponse.json({ error: 'UserId and trainingPlanIds array are required' }, { status: 400 });
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
      if (roleData && roleData.permissions && hasPermission(roleData.permissions, 'training_plans_assign')) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to manage training plan assignments' }, { status: 403 });
    }

    // 3. Update the target user
    const userRef = adminDb.collection('users').doc(userId);
    
    if (action === 'unassign') {
      await userRef.update({
        assignedTrainingPlans: admin.firestore.FieldValue.arrayRemove(...trainingPlanIds)
      });
    } else {
      await userRef.update({
        assignedTrainingPlans: admin.firestore.FieldValue.arrayUnion(...trainingPlanIds)
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
