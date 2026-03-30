import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    console.log(`API: Attempting to delete user from Auth: ${uid}`);
    
    // Delete user from Firebase Authentication
    await adminAuth.deleteUser(uid);
    
    console.log(`API: Successfully deleted user from Auth: ${uid}`);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error: Failed to delete user from Auth:', error.message);
    
    // If user doesn't exist in Auth, we can consider it a success for our purposes
    if (error.code === 'auth/user-not-found') {
      return NextResponse.json({ success: true, message: 'User already removed from Auth' });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
