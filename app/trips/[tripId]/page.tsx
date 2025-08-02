'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTripStore } from '@/stores/useTripStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useExpenseStore } from '@/stores/useExpenseStore';
import Link from 'next/link';
import InviteForm from '@/app/components/InviteForm';
import Image from 'next/image';
import { db } from '@/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ExpenseList from '@/app/components/ExpenseList';
import SettlementSummary from '@/app/components/SettlementSummary';

// Interface for member data
interface MemberData {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

// Add this at the top of your file
const DEFAULT_AVATAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#64748B">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
</svg>
`;

const DEFAULT_AVATAR = `data:image/svg+xml;base64,${btoa(DEFAULT_AVATAR_SVG)}`;


export default function TripPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [endingTrip, setEndingTrip] = useState(false);

  const { tripId } = useParams<{ tripId: string }>();
  const { currentTrip, isLoading, error, fetchTripById, endTrip } = useTripStore();
  const { user, loading: authLoading, initialized } = useAuthStore();
  const { fetchExpenses } = useExpenseStore();
  const router = useRouter();
  
  const handleEndTrip = async () => {
    if (!window.confirm("Are you sure you want to end this trip? This will finalize all expenses and calculate settlements.")) {
      return;
    }
    
    setEndingTrip(true);
    try {
      // First, make sure expenses are loaded for the trip
      console.log("Loading expenses before ending trip");
      await fetchExpenses(tripId as string);
      
      // Then end the trip and update trip data
      await endTrip(tripId as string);
      
      // Refresh trip data
      await fetchTripById(tripId as string);
    } catch (error) {
      console.error("Error ending trip:", error);
      alert("Failed to end trip. Please try again.");
    } finally {
      setEndingTrip(false);
    }
  };

  // Fetch trip data when user is authenticated
  useEffect(() => {
    if (tripId && user && initialized) {
      console.log("Fetching trip data for ID:", tripId);
      fetchTripById(tripId as string);
    }
  }, [tripId, fetchTripById, user, initialized]);
  
  // Redirect to login if not authenticated and auth is initialized
  useEffect(() => {
    if (!user && !authLoading && initialized) {
      console.log("User not authenticated, redirecting to login");
      router.push(`/login?redirect=/trips/${tripId}`);
    }
  }, [user, authLoading, initialized, router, tripId]);
  
  // Preload expenses for ended trips to ensure settlement calculations work
  useEffect(() => {
    if (currentTrip && currentTrip.status === 'ended' && tripId) {
      console.log("Preloading expenses for ended trip:", tripId);
      fetchExpenses(tripId as string);
    }
  }, [currentTrip?.status, tripId, fetchExpenses]);

  // Fetch member data when trip data is loaded
  useEffect(() => {
    async function fetchMemberData() {
      if (currentTrip?.members && currentTrip.members.length > 0) {
        setLoadingMembers(true);

        try {
          const memberPromises = currentTrip.members.map(async (memberId: string) => {
            const userDocRef = doc(db, 'users', memberId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                uid: memberId,
                displayName: userData.displayName || userData.email?.split('@')[0] || 'Unknown',
                photoURL: userData.photoURL || '/default-avatar.png',
                email: userData.email || ''
              };
            } else {
              // Return placeholder for users not found
              return {
                uid: memberId,
                displayName: 'Unknown User',
                photoURL: '/default-avatar.png',
                email: ''
              };
            }
          });

          const memberData = await Promise.all(memberPromises);
          setMembers(memberData);
        } catch (err) {
          console.error("Error fetching member data:", err);
        } finally {
          setLoadingMembers(false);
        }
      }
    }

    fetchMemberData();
  }, [currentTrip?.members]);

  console.log("Current Trip:", currentTrip);
  console.log("Trip ID from params:", tripId);
  console.log("Is Loading:", isLoading);
  console.log("Error:", error);
  console.log("Trip ID:", tripId);
  console.log("User:", user);
  console.log("Members:", members);

  // Loading state
  if (isLoading || authLoading || !initialized || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Loading Trip Details...</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentTrip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-center text-red-600">Error</h1>
          <p className="text-center mb-6">{error || "Trip not found"}</p>
          <div className="flex justify-center">
            <Link
              href="/"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-black">{currentTrip.name}</h1>

            <div className="flex space-x-3">
              {/* Only show invite button if trip is active */}
              {(!currentTrip.status || currentTrip.status === 'active') && (
                <button
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                >
                  {showInviteForm ? 'Hide Invite Form' : 'Invite People'}
                </button>
              )}
              
              {/* Only show end trip button if trip is active and current user is creator */}
              {(!currentTrip.status || currentTrip.status === 'active') && 
               currentTrip.createdBy === user?.uid && (
                <button
                  onClick={() => handleEndTrip()}
                  className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition"
                >
                  End Trip & Settle Up
                </button>
              )}
            </div>
          </div>

          {currentTrip.description && (
            <p className="text-gray-700 mb-4">{currentTrip.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-500">Currency</span>
              <p className="font-medium text-black">{currentTrip.currency}</p>
            </div>

            {currentTrip.startDate && (
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-500">Start Date</span>
                <p className="font-medium text-black">
                  {new Date(currentTrip.startDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {currentTrip.endDate && (
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-500">End Date</span>
                <p className="font-medium text-black">
                  {new Date(currentTrip.endDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {showInviteForm && (
            <div className="mb-6 border-t pt-4">
              <InviteForm
                tripId={tripId as string}
                onClose={() => setShowInviteForm(false)}
              />
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Trip Members</h2>

            {loadingMembers ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : members.length > 0 ? (
                <div className="flex -space-x-4">
                {members.map(member => (
                  <div 
                  key={member.uid} 
                  className="group relative"
                  >
                  <Avatar className="h-12 w-12 border-2 border-white rounded-full hover:z-10 hover:scale-110 transition-transform">
                    <AvatarImage 
                    src={member.photoURL} 
                    alt={member.displayName} 
                    />
                    <AvatarFallback>
                    {member.displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute z-20 invisible group-hover:visible bg-white shadow-lg rounded-md p-2 min-w-[120px] -translate-x-1/2 left-1/2 top-14">
                    <p className="font-medium text-sm">{member.displayName}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  </div>
                ))}
                </div>
              ) : (
                <p className="text-gray-500">No members found for this trip.</p>
              )}

          {currentTrip.invitedEmails && currentTrip.invitedEmails.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Pending Invitations</h3>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <ul className="list-disc pl-5">
                  {currentTrip.invitedEmails.map((email: string) => (
                    <li key={email} className="text-gray-600">{email}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Ended Trip - Show Settlements */}
        {currentTrip.status === 'ended' ? (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Final Settlements</h2>
                <div className="text-sm py-1 px-3 bg-amber-100 text-amber-800 rounded-full">
                  Trip Ended on {currentTrip.endDate ? new Date(currentTrip.endDate).toLocaleDateString() : 'Unknown date'}
                </div>
              </div>
              
              <SettlementSummary 
                tripId={tripId as string} 
                trip={currentTrip} 
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Expense History</h2>
              
              <ExpenseList 
                tripId={tripId as string}
                tripCurrency={currentTrip.currency}
                members={members}
                readOnly={true}
              />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Expenses</h2>
            
            <ExpenseList 
              tripId={tripId as string} 
              tripCurrency={currentTrip.currency}
              members={members} 
            />
          </div>
        )}
        
        {/* Show pending end trip while loading */}
        {endingTrip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Ending trip and calculating settlements...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}