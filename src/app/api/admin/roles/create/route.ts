import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { name, description, permissions, createdBy } = await request.json();

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Name and permissions array are required' },
        { status: 400 }
      );
    }

    const roleRef = adminDb.collection('staffRoles').doc();
    
    const roleData = {
      name,
      description: description || '',
      permissions,
      createdBy: createdBy || 'unknown',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await roleRef.set(roleData);

    return NextResponse.json({ 
      success: true, 
      role: { id: roleRef.id, ...roleData, createdAt: new Date().toISOString() } 
    });
  } catch (error: any) {
    console.error('API Error: Failed to create staff role:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
