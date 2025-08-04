'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/stores/useTripStore';
import { useAuthStore } from '@/stores/useAuthStore';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';

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
          <h1 className="text-2xl sm:text-3xl font-semibold">My Trips</h1>

          <Link
            href="/trips/new"
            className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600 transition flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Trip
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {trips.length === 0 ? (
          <Card className="border border-dashed border-gray-200 p-8 text-center">
            <CardContent className="pt-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-semibold mb-2">No trips yet</h2>
              <p className="text-gray-500 mb-6">
                You haven't created or been invited to any trips yet.
              </p>
              <Link
                href="/trips/new"
                className="px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Trip
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((trip) => {
              // Determine if trip is active or ended (for the glow effect)
              const isActive = !trip.status || trip.status === 'active';
              const statusClass = isActive
                ? 'before:bg-emerald-500/20 hover:before:bg-emerald-500/30'
                : 'before:bg-blue-500/20 hover:before:bg-blue-500/30';

              return (
                <Link
                  href={`/trips/${trip.id}`}
                  key={trip.id}
                  className={`block relative before:absolute before:inset-0 before:rounded-lg before:z-0 hover:scale-[1.01] transition-all duration-200 ${statusClass}`}
                >
                  <Card className="relative z-10 border border-gray-100 h-full overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${isActive ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg leading-tight truncate">{trip.name}</CardTitle>
                          {trip.description && (
                            <CardDescription className="line-clamp-1">{trip.description}</CardDescription>
                          )}
                        </div>
                        {trip.currency && (
                          <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded ml-2">{trip.currency}</span>
                        )}
                      </div>
                    </CardHeader>

                    <CardFooter className="px-4 py-3 flex justify-between border-t border-gray-50 bg-gray-50/50 text-xs">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-600">
                          {trip.startDate?.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          {trip.startDate && trip.endDate && ' - '}
                          {trip.endDate?.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isActive ? 'Active' : 'Completed'}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
