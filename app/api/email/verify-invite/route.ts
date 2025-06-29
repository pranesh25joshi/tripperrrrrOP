import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebaseConfig';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';

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

    // Query Firestore for the token
    const tokensRef = collection(db, "invitationTokens");
    const q = query(tokensRef, where("token", "==", token));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      );
    }
    
    // Get the token document
    const tokenDoc = querySnapshot.docs[0];
    const tokenData = tokenDoc.data();
    
    // Check if token is already used
    if (tokenData.status === "accepted") {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      );
    }
    
    // Check if token is expired
    const now = new Date();
    const expires = tokenData.expires instanceof Timestamp 
      ? tokenData.expires.toDate()
      : new Date(tokenData.expires);
      
    if (now > expires) {
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
      token,
      tokenId: tokenDoc.id, // Include the document ID for later reference
      description: tripData.description || '',
      createdBy: tripData.createdBy || ''
    });
    
  } catch (error: any) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json(
      { error: 'Failed to verify invitation: ' + error.message },
      { status: 500 }
    );
  }
}