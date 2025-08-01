'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/stores/useTripStore';
import { useAuthStore } from '@/stores/useAuthStore';
import Link from 'next/link';

export default function TripsPage() {
  const { trips, isLoading: tripsLoading, error, fetchTrips } = useTripStore();
  const { user, loading: authLoading, initialized } = useAuthStore();
  const router = useRouter();

  // Fetch trips when user is authenticated
  useEffect(() => {
    if (user && initialized) {
      fetchTrips(user.uid);
    }
  }, [user, fetchTrips, initialized]);

  // Redirect to login if not authenticated and auth is initialized
  useEffect(() => {
    if (!user && !authLoading && initialized) {
      console.log("User not authenticated, redirecting to login");
      router.push('/login?redirect=/trips');
    }
  }, [user, authLoading, initialized, router]);

  // Loading state
  if (tripsLoading || authLoading || !initialized || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Loading Trips...</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Trips</h1>
          
          <Link 
            href="/trips/new"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Create New Trip
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {trips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-3">No trips yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't created or been invited to any trips yet.
            </p>
            <Link 
              href="/trips/new"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Create Your First Trip
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Link 
                href={`/trips/${trip.id}`}
                key={trip.id}
                className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-2">{trip.name}</h2>
                  {trip.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{trip.description}</p>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-black">
                      {trip.startDate && new Date(trip.startDate).toLocaleDateString()}
                      {trip.startDate && trip.endDate && ' - '}
                      {trip.endDate && new Date(trip.endDate).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-black">{trip.currency}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
