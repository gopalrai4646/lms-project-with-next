import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const adminQuery = await adminDb
      .collection('users')
      .where('role', '==', 'admin')
      .limit(1)
      .get();

    return NextResponse.json({ 
      success: true, 
      adminExists: !adminQuery.empty 
    });
  } catch (error: any) {
    console.error('Error checking admin existence:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check admin status' },
      { status: 500 }
    );
  }
}
