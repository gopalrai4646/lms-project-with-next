import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const snapshot = await adminDb.collection('staffRoles').orderBy('createdAt', 'desc').get();

    const roles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Timestamp to ISO string for JSON serialization
      createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString() || null,
    }));

    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    console.error('API Error: Failed to list staff roles:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
