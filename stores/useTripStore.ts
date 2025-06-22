import { create } from "zustand";
import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { UserProfile } from "./useAuthStore";

export interface Trip {
  id: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  currency: string;
  createdBy: string; // user ID
  createdAt: Timestamp;
  members: string[]; // Array of user IDs
  invitedEmails?: string[]; // Emails invited but not joined yet
}

export interface TripInput {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  currency: string;
  invitedEmails?: string[];
}

interface TripState {
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  createTrip: (tripData: TripInput, userId: string) => Promise<string | undefined>;
  fetchTrips: (userId: string) => Promise<void>;
  fetchTripById: (tripId: string) => Promise<void>;
  inviteToTrip: (tripId: string, emails: string[]) => Promise<void>;
  sendTripInvitations: (tripId: string, emails: string[], senderName: string, senderEmail: string) => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,

  createTrip: async (tripData: TripInput, userId: string) => {
    try {

        set({ isLoading: true, error: null });
        const tripRef = await addDoc(collection(db,"trips"), {
            ...tripData,
            createdBy: userId,
            createdAt: serverTimestamp(),
            members: [userId], // Add creator as member
        });

        // Fetch the newly created trip to update state
        const tripSnap = await getDoc(tripRef);
        const newTrip = {
            id: tripSnap.id,
            ...tripSnap.data()
        } as Trip;

        set(state => ({
            trips: [...state.trips, newTrip],
            currentTrip: newTrip,
            isLoading: false
        }));

        return tripSnap.id;

    } catch (error) {
      console.error("Error creating trip:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to create trip",
        isLoading: false
      });
    }
  },
  
  fetchTrips: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Query trips where user is a member
      const tripsQuery = query(
        collection(db, "trips"),
        where("members", "array-contains", userId)
      );
      
      const querySnapshot = await getDocs(tripsQuery);
      const trips: Trip[] = [];
      
      querySnapshot.forEach((doc) => {
        trips.push({
          id: doc.id,
          ...doc.data()
        } as Trip);
      });
      console.log("Fetched trips:", trips);
      
      set({ trips, isLoading: false });
    } catch (error) {
      console.error("Error fetching trips:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch trips",
        isLoading: false
      });
    }
  },
  
  fetchTripById: async (tripId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const tripDoc = await getDoc(doc(db, "trips", tripId));
      
      if (tripDoc.exists()) {
        const tripData = {
          id: tripDoc.id,
          ...tripDoc.data()
        } as Trip;
        
        set({ currentTrip: tripData, isLoading: false });
      } else {
        set({ 
          error: "Trip not found", 
          isLoading: false 
        });
      }
    } catch (error) {
      console.error("Error fetching trip:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch trip",
        isLoading: false
      });
    }
  },
  
  inviteToTrip: async (tripId: string, emails: string[]) => {
    try {
      set({ isLoading: true, error: null });
      
      const tripRef = doc(db, "trips", tripId);
      const tripDoc = await getDoc(tripRef);
      
      if (!tripDoc.exists()) {
        throw new Error("Trip not found");
      }
      
      const currentData = tripDoc.data();
      const existingEmails = currentData.invitedEmails || [];
      
      // Update with new invited emails
      await updateDoc(tripRef, {
        invitedEmails: [...existingEmails, ...emails]
      });
      
      // Update the current trip state
      if (get().currentTrip?.id === tripId) {
        set(state => ({
          currentTrip: state.currentTrip 
            ? {
                ...state.currentTrip,
                invitedEmails: [...existingEmails, ...emails]
              }
            : null,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error("Error inviting to trip:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to invite to trip",
        isLoading: false
      });
    }
  },

  sendTripInvitations: async (tripId: string, emails: string[], senderName: string, senderEmail: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // First update the trip document with invited emails
      await get().inviteToTrip(tripId, emails);
      
      // Then send the invitation emails via SendGrid API
      const response = await fetch('/api/email/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId,
          emails,
          senderName,
          senderEmail
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation emails');
      }
      
      set({ isLoading: false });
    } catch (error) {
      console.error("Error sending trip invitations:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to send trip invitations",
        isLoading: false
      });
    }
  }
}));