'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import Link from 'next/link';

interface TripInvitation {
  tripId: string;
  tripName: string;
  email: string;
  token: string;
}

export default function InvitePage() {
  const [invitation, setInvitation] = useState<TripInvitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Verify the invitation token
  useEffect(() => {
    async function verifyInvitation() {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/email/verify-invite?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify invitation');
        }

        setInvitation({
          tripId: data.tripId,
          tripName: data.tripName,
          email: data.email,
          token: data.token
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    verifyInvitation();
  }, [token]);

  // Handle accepting the invitation
  const handleAcceptInvitation = async () => {
    if (!user || !invitation) return;

    setAccepting(true);
    
    try {
      const response = await fetch('/api/email/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: invitation.token,
          userId: user.uid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setSuccess(true);
      
      // Redirect to trip page after a short delay
      setTimeout(() => {
        router.push(`/trips/${invitation.tripId}`);
      }, 2000);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setAccepting(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-blue-600 h-2"></div>
          <div className="p-8">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-6"></div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Verifying Invitation</h1>
              <p className="text-gray-600 text-center">
                Please wait while we verify your invitation link...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-red-600 h-2"></div>
          <div className="p-8">
            <div className="flex flex-col items-center">
              <div className="bg-red-100 p-3 rounded-full mb-6">
                <svg className="w-12 h-12 text-red-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Invitation Error</h1>
              <p className="text-gray-600 text-center mb-6">{error}</p>
              <Link 
                href="/"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-green-600 h-2"></div>
          <div className="p-8">
            <div className="flex flex-col items-center">
              <div className="bg-green-100 p-3 rounded-full mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Success!</h1>
              <p className="text-gray-600 text-center mb-2">
                You have successfully joined <span className="font-medium">{invitation?.tripName}</span>
              </p>
              <p className="text-gray-500 text-sm mb-6">Redirecting you to the trip page...</p>
              <Link 
                href={`/trips/${invitation?.tripId}`}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                View Trip
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render invitation acceptance UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 h-2"></div>
        {invitation ? (
          <div className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">Trip Invitation</h1>
              <p className="text-gray-500">Join this trip on Trip Sliptos</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-5 mb-6 border border-blue-100">
              <p className="text-sm text-blue-800 font-medium mb-1">
                You've been invited to join:
              </p>
              <h2 className="text-xl font-bold text-blue-900 mb-2">{invitation.tripName}</h2>
              <div className="flex items-center text-blue-700 text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                <span>Sent to: {invitation.email}</span>
              </div>
            </div>
            
            {!user ? (
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Please sign in to accept this invitation
                </p>
                <Link 
                  href={`/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition duration-200"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                  </svg>
                  Sign In to Accept
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg mb-6">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-blue-700 font-bold">
                      {user.displayname ? user.displayname[0].toUpperCase() : user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{user.displayname || user.email}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleAcceptInvitation}
                  disabled={accepting}
                  className={`w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition duration-200 shadow-md
                    ${accepting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'} 
                    text-white`}
                >
                  {accepting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Accept Invitation
                    </>
                  )}
                </button>
                
                {user.email !== invitation.email && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="flex">
                      <svg className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                      </svg>
                      <p className="text-sm text-amber-800">
                        Note: You're signed in with a different email ({user.email}) than the invitation was sent to ({invitation.email}).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h1 className="text-xl font-bold text-gray-700 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We couldn't load the invitation details. Please try again.
            </p>
            <Link 
              href="/"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200"
            >
              Return Home
            </Link>
          </div>
        )}
        
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
          <div className="text-sm text-gray-500 flex items-center">
            <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            Trip Sliptos - Share expenses with friends
          </div>
        </div>
      </div>
    </div>
  );
}
