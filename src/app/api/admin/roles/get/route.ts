import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const doc = await adminDb.collection('staffRoles').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    const role = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: doc.data()?.updatedAt?.toDate().toISOString() || null,
    };

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error('API Error: Failed to get staff role:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
