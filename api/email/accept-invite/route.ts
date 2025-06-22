import { NextResponse } from 'next/server';
import { tokenStore } from '../send-invite/route';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json();

    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Token and userId are required' },
        { status: 400 }
      );
    }

    // Validate token
    const tokenData = tokenStore.get(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check token expiration
    if (Date.now() > tokenData.expires) {
      // Remove expired token
      tokenStore.delete(token);
      
      return NextResponse.json(
        { error: 'Invitation link has expired' },
        { status: 400 }
      );
    }

    const { tripId, email } = tokenData;

    // Get trip details
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Add user to trip members and remove from invitedEmails
    await updateDoc(tripRef, {
      members: arrayUnion(userId),
      invitedEmails: arrayRemove(email)
    });

    // Clear the token after successful acceptance
    tokenStore.delete(token);

    return NextResponse.json({
      success: true,
      message: 'You have successfully joined the trip',
      tripId
    });
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
