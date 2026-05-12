import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const roleRef = adminDb.collection('staffRoles').doc(id);
    
    // Check if role exists
    const roleDoc = await roleRef.get();
    if (!roleDoc.exists) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    await roleRef.delete();

    // Optionally: Update all users who had this role to remove staffRoleId
    // This is good practice for data integrity
    const usersWithRole = await adminDb.collection('users').where('staffRoleId', '==', id).get();
    
    if (!usersWithRole.empty) {
      const batch = adminDb.batch();
      usersWithRole.docs.forEach(userDoc => {
        batch.update(userDoc.ref, { staffRoleId: null, role: 'student' });
      });
      await batch.commit();
      console.log(`API: Demoted ${usersWithRole.size} staff members after role deletion.`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error: Failed to delete staff role:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
