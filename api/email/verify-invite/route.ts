import { NextResponse } from 'next/server';
import { tokenStore } from '../send-invite/route';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    // Get token from query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
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

    // Get trip details
    const tripRef = doc(db, 'trips', tokenData.tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const tripData = tripSnap.data();
    
    // Return trip and invitation details
    return NextResponse.json({
      success: true,
      tripId: tokenData.tripId,
      email: tokenData.email,
      tripName: tripData.name,
      token // Include token for accept-invite step
    });
    
  } catch (error) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json(
      { error: 'Failed to verify invitation' },
      { status: 500 }
    );
  }
}
