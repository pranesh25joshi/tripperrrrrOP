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
import { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
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
  const [activeMember, setActiveMember] = useState<string | null>(null);

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
                displayName: userData.displayname || userData.email?.split('@')[0] || 'Unknown',
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

  // Close member details popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the click was outside of any member avatar or details
      const clickedOnAvatar = (event.target as Element)?.closest('.member-avatar');
      const clickedOnDetails = (event.target as Element)?.closest('.member-details');
      
      if (!clickedOnAvatar && !clickedOnDetails) {
        setActiveMember(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        <Card className="mb-6">
          <CardHeader className="flex flex-row justify-between items-start gap-4 pb-3 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl font-semibold truncate">{currentTrip.name}</CardTitle>
              {currentTrip.description && (
                <CardDescription className="mt-1 text-sm line-clamp-2">{currentTrip.description}</CardDescription>
              )}
            </div>

            <div className="flex flex-shrink-0 gap-2 sm:gap-3 sm:flex-nowrap sm:space-x-1">
              {/* Only show invite button if trip is active */}
              {(!currentTrip.status || currentTrip.status === 'active') && (
                <button
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  className={`h-8 w-8 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 text-sm ${showInviteForm ? 'bg-gray-500' : 'bg-emerald-500'} text-white rounded hover:opacity-90 transition flex items-center justify-center`}
                  title={showInviteForm ? 'Hide Invite Form' : 'Invite People'}
                >
                  {showInviteForm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{showInviteForm ? 'Hide Invite Form' : 'Invite People'}</span>
                </button>
              )}
              
              {/* Only show end trip button if trip is active and current user is creator */}
              {(!currentTrip.status || currentTrip.status === 'active') && 
               currentTrip.createdBy === user?.uid && (
                <button
                  onClick={() => handleEndTrip()}
                  className="h-8 w-8 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 text-sm bg-blue-600 text-white rounded hover:opacity-90 transition flex items-center justify-center"
                  title="End Trip & Settle Up"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">End Trip & Settle Up</span>
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6">
              <div className="flex flex-col">
                <span className="text-xs text-[var(--muted-foreground)]">Currency</span>
                <p className="font-medium mt-1">{currentTrip.currency}</p>
              </div>

              {currentTrip.startDate && (
                <div className="flex flex-col">
                  <span className="text-xs text-[var(--muted-foreground)]">Start Date</span>
                  <p className="font-medium mt-1">
                    {new Date(currentTrip.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {currentTrip.endDate && (
                <div className="flex flex-col">
                  <span className="text-xs text-[var(--muted-foreground)]">End Date</span>
                  <p className="font-medium mt-1">
                    {new Date(currentTrip.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>

          {showInviteForm && (
            <CardFooter className="border-t border-gray-100 flex-col items-start pt-4">
              <InviteForm
                tripId={tripId as string}
                onClose={() => setShowInviteForm(false)}
              />
            </CardFooter>
          )}
        </Card>

        {/* Members Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Trip Members</CardTitle>
          </CardHeader>
          
          <CardContent>
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
                    <Avatar 
                      className="h-12 w-12 border-2 border-white rounded-full hover:z-10 hover:scale-110 transition-transform cursor-pointer member-avatar"
                      onClick={() => setActiveMember(activeMember === member.uid ? null : member.uid)}
                    >
                      <AvatarImage 
                        src={member.photoURL} 
                        alt={member.displayName} 
                      />
                      <AvatarFallback>
                        {member.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className={`absolute z-20 bg-white shadow-lg rounded-md p-3 min-w-[140px] -translate-x-1/2 left-1/2 top-14 member-details
                        ${activeMember === member.uid ? 'block' : 'invisible sm:group-hover:visible'}`}
                    >
                      <p className="font-medium text-sm mb-1">{member.displayName}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                      {activeMember === member.uid && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMember(null);
                          }}
                          className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
                          aria-label="Close details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
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
          </CardContent>
        </Card>

        {/* Ended Trip - Show Settlements */}
        {currentTrip.status === 'ended' ? (
          <>
            <Card className="mb-6 overflow-hidden">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle>Final Settlements</CardTitle>
                <div className="text-sm py-1 px-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full self-start sm:self-auto whitespace-nowrap">
                  Trip Ended on {currentTrip.endDate ? new Date(currentTrip.endDate).toLocaleDateString() : 'Unknown date'}
                </div>
              </CardHeader>
              
              <CardContent>
                <SettlementSummary 
                  tripId={tripId as string} 
                  trip={currentTrip} 
                />
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Expense History</CardTitle>
              </CardHeader>
              
              <CardContent>
                <ExpenseList 
                  tripId={tripId as string}
                  tripCurrency={currentTrip.currency}
                  members={members}
                  readOnly={true}
                />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseList 
                tripId={tripId as string} 
                tripCurrency={currentTrip.currency}
                members={members} 
              />
            </CardContent>
          </Card>
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