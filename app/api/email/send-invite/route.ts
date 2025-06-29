import { db } from "@/firebase/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { MailtrapClient } from "mailtrap";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";

// Better token generator
function generateSecureToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { tripId, emails, senderName, senderEmail } = await req.json();

    if (!tripId || !emails || !senderName || !senderEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    console.log(
      `Received request to send invitations for trip ${tripId} to emails: ${emails}`
    );

    // Get trip details
    const tripRef = doc(db, "trips", tripId);
    const tripSnap = await getDoc(tripRef);

    if (!tripSnap.exists()) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const tripData = tripSnap.data();

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const resend = new Resend(RESEND_API_KEY);

    // Generate and send unique tokens for each recipient
    const results = [];

    for (const recipientEmail of emails) {
      try {
        console.log(`Sending invitation to: ${recipientEmail}`);

        // Generate unique token for this recipient
        const uniqueToken = generateSecureToken();

        // Calculate expiration date (7 days from now)
        const expires = new Date();
        expires.setDate(expires.getDate() + 7); // 7 days from now

        // Store token in Firestore
        const tokenRef = await addDoc(collection(db, "invitationTokens"), {
          token: uniqueToken,
          email: recipientEmail,
          tripId,
          created: serverTimestamp(),
          expires,
          status: "pending", // can be "pending", "accepted", "expired"
        });

        console.log(`Created token document with ID: ${tokenRef.id}`);

        // Create invite URL with unique token
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite?token=${uniqueToken}`;

        // Send email with personal link
        await resend.emails.send({
          from: `Pranesh <invitetrips@pranesh.xyz>`,
          to: [recipientEmail],
          subject: `${senderName} invited you to join a trip on Trip Sliptos`,
          text: `${senderName} (${senderEmail}) has invited you to join "${tripData.name}" on Trip Sliptos. Click this link to accept: ${inviteUrl}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Trip Invitation</h2>
              <p><strong>${senderName}</strong> has invited you to join their trip:</p>
              <h3 style="margin-top: 0;">${tripData.name}</h3>

          <div style="background-color: #f5f5f5; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;">${tripData.description || "Join this trip to split expenses and plan together!"}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>

          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #666; font-size: 14px;">${inviteUrl}</p>
        </div>
      `,
        });

        // Add to invitedEmails list in Firestore
        await updateDoc(tripRef, {
          invitedEmails: arrayUnion(recipientEmail),
        });

        results.push({ email: recipientEmail, success: true });
      } catch (error) {
        console.error(`Failed to send invitation to ${recipientEmail}:`, error);
        results.push({
          email: recipientEmail,
          success: false,
          error: error.message,
        });
      }
    }

    // Return results
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    if (failed === 0) {
      return NextResponse.json({
        success: true,
        message: `Successfully sent ${successful} invitation(s)`,
      });
    } else {
      return NextResponse.json(
        {
          partialSuccess: true,
          success: successful,
          failed: failed,
          details: results.filter((r) => !r.success),
        },
        { status: 207 }
      ); // Multi-status
    }
  } catch (error: any) {
    console.error("Error sending invitations:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
