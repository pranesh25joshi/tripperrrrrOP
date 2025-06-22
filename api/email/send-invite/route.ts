import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import { db } from '@/firebase/firebaseConfig';
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// In-memory token store (consider moving to DB for production)
interface TokenData {
  email: string;
  tripId: string;
  expires: number; // timestamp
}

const tokenStore = new Map<string, TokenData>();

// Token expiration time in milliseconds (24 hours)
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const { tripId, emails, senderName, senderEmail } = await request.json();

    if (!tripId || !emails || !emails.length) {
      return NextResponse.json(
        { error: 'Missing required fields: tripId and emails' },
        { status: 400 }
      );
    }

    // Verify the trip exists
    const tripRef = doc(db, 'trips', tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    const tripData = tripSnap.data();
    const tripName = tripData.name;

    // Update trip with invited emails
    await updateDoc(tripRef, {
      invitedEmails: arrayUnion(...emails)
    });

    // Generate and store tokens for each email
    const sentEmails = await Promise.all(emails.map(async (email: string) => {
      // Generate a unique token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Store token with email and tripId
      tokenStore.set(token, {
        email,
        tripId,
        expires: Date.now() + TOKEN_EXPIRY
      });

      // Create invite URL
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${token}`;

      // Create email template
      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || senderEmail,
        subject: `You're invited to join ${tripName} on Trip Sliptos`,
        text: `${senderName || 'Someone'} has invited you to join their trip '${tripName}' on Trip Sliptos. Click the link to join: ${inviteUrl}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">Trip Invitation</h2>
            <p>${senderName || 'Someone'} has invited you to join their trip:</p>
            <h3 style="margin: 15px 0; color: #1e3a8a;">${tripName}</h3>
            <p>Use Trip Sliptos to split expenses and keep track of who owes what during your trip.</p>
            <a href="${inviteUrl}" style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
              Join Trip
            </a>
            <p style="color: #6b7280; font-size: 14px;">This invitation link will expire in 24 hours.</p>
          </div>
        `,
      };

      // Send email
      await sgMail.send(msg);
      return email;
    }));

    return NextResponse.json({
      success: true,
      message: `Invitation emails sent to ${sentEmails.join(', ')}`,
      invitedCount: sentEmails.length
    });
    
  } catch (error) {
    console.error('Error sending invite emails:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation emails' },
      { status: 500 }
    );
  }
}

// Export the token store so it can be accessed by other routes
export { tokenStore };