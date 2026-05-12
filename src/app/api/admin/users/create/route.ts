import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
  try {
    const { name, email, password, staffRoleId } = await request.json();

    if (!name || !email || !password || !staffRoleId) {
      return NextResponse.json(
        { error: 'Name, email, password, and staffRoleId are required' },
        { status: 400 }
      );
    }

    // 1. Create the user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email.toLowerCase(),
      password,
      displayName: name,
    });

    console.log(`API: Created staff user in Auth: ${userRecord.uid}`);

    // 2. Create the user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email.toLowerCase(),
      displayName: name,
      role: 'staff',
      staffRoleId,
      photoURL: null,
      phoneNumber: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`API: Created staff user doc in Firestore: ${userRecord.uid}`);

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    console.error('API Error: Failed to create staff user:', error.message);

    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'A user with this email already exists.' },
        { status: 400 }
      );
    }
    if (error.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
