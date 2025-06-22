'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTripStore } from '@/stores/useTripStore';
import { useAuthStore } from '@/stores/useAuthStore';
import Link from 'next/link';
import InviteForm from '@/app/components/InviteForm';

export default function TripPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const { tripId } = useParams<{ tripId: string }>();
  const { currentTrip, isLoading, error, fetchTripById } = useTripStore();
  console.log("Current Trip:", currentTrip);
  console.log("Trip ID from params:", tripId);
  console.log("Is Loading:", isLoading);
    console.log("Error:", error);
    console.log("Trip ID:", tripId);
  const { user } = useAuthStore();
  
  useEffect(() => {
    if (tripId) {
      fetchTripById(tripId as string);
    }
  }, [tripId, fetchTripById]);
  
  // Loading state
  if (isLoading || !user) {
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
            <h1 className="text-3xl font-bold">{currentTrip.name}</h1>
            
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              {showInviteForm ? 'Hide Invite Form' : 'Invite People'}
            </button>
          </div>
          
          {currentTrip.description && (
            <p className="text-gray-700 mb-4">{currentTrip.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-gray-50 rounded">
              <span className="text-sm text-gray-500">Currency</span>
              <p className="font-medium">{currentTrip.currency}</p>
            </div>
            
            {currentTrip.startDate && (
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-500">Start Date</span>
                <p className="font-medium">
                  {new Date(currentTrip.startDate).toLocaleDateString()}
                </p>
              </div>
            )}
            
            {currentTrip.endDate && (
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-500">End Date</span>
                <p className="font-medium">
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
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Trip Details</h2>
          <p className="text-gray-600 mb-6">
            This is where the trip expenses and other details will be displayed.
          </p>
          
          {/* Placeholder for future content */}
          <div className="p-4 bg-blue-50 text-blue-800 rounded-lg">
            <p>
              The trip page is under construction. Additional features like expense tracking, 
              settlements, and member management will be added soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
