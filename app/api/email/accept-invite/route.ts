import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebaseConfig';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json();

    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Token and userId are required' },
        { status: 400 }
      );
    }

    console.log(`Processing invitation acceptance for token: ${token}, user: ${userId}`);
    
    // Query Firestore for the token - minimal validation since verify already happened
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
    const tokenId = tokenDoc.id;
    
    // Only check if already accepted (most critical validation)
    if (tokenData.status === "accepted") {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      );
    }

    const tripId = tokenData.tripId;
    const email = tokenData.email;

    // Get trip directly
    const tripRef = doc(db, 'trips', tripId);

    // Add user to trip members and remove from invitedEmails
    await updateDoc(tripRef, {
      members: arrayUnion(userId),
      invitedEmails: arrayRemove(email)
    });

    // Update token status to accepted
    await updateDoc(doc(db, "invitationTokens", tokenId), {
      status: "accepted",
      acceptedBy: userId,
      acceptedAt: new Date()
    });

    console.log(`User ${userId} successfully joined trip ${tripId}`);

    return NextResponse.json({
      success: true,
      message: 'You have successfully joined the trip',
      tripId
    });
    
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation: ' + error.message },
      { status: 500 }
    );
  }
}