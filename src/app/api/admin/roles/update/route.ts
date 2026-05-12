import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { id, name, description, permissions } = await request.json();

    if (!id || !name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'ID, name, and permissions array are required' },
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

    const updateData = {
      name,
      description: description || '',
      permissions,
    };

    await roleRef.update(updateData);

    return NextResponse.json({ 
      success: true, 
      role: { id, ...roleDoc.data(), ...updateData } 
    });
  } catch (error: any) {
    console.error('API Error: Failed to update staff role:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
