'use client';

import React, { useState, useEffect } from 'react';
import { useExpenseStore, Settlement as StoreSettlement } from '@/stores/useExpenseStore';
import { Trip } from '@/stores/useTripStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from "sonner";

interface SettlementProps {
  tripId: string;
  trip: Trip;
}

interface UserDetails {
  displayName: string;
  photoURL?: string;
  email?: string;
}

interface DisplaySettlement {
  from: string;
  fromDetails?: UserDetails;
  to: string;
  toDetails?: UserDetails;
  amount: number;
}

export default function SettlementSummary({ tripId, trip }: SettlementProps) {
  const [settlements, setSettlements] = useState<DisplaySettlement[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, UserDetails>>({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const { calculateOptimizedSettlements, expenses, isLoading } = useExpenseStore();
  
  // We will NOT fetch expenses in this component - the parent component should handle that
  // This removes the circular dependency between components
  
  // Fetch member data to display names and photos instead of IDs
  useEffect(() => {
    const fetchMemberData = async () => {
      setIsLoadingMembers(true);
      try {
        const userMap: Record<string, UserDetails> = {};
        
        // Get all member IDs from the trip
        if (trip.members && trip.members.length > 0) {
          await Promise.all(
            trip.members.map(async (memberId) => {
              try {
                const userDoc = await getDoc(doc(db, "users", memberId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  userMap[memberId] = {
                    displayName: userData.displayname || userData.email?.split('@')[0] || "Unknown User",
                    photoURL: userData.photoURL || '',
                    email: userData.email || ''
                  };
                }
              } catch (error) {
                console.error("Error fetching user data:", error);
              }
            })
          );
        }
        
        setMemberMap(userMap);
      } catch (error) {
        console.error("Error loading member data:", error);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    if (trip.members?.length) {
      fetchMemberData();
    }
  }, [trip.members]);
  
  // Use a ref to track if calculation is in progress
  const [calculationInProgress, setCalculationInProgress] = useState(false);
  const [calculationComplete, setCalculationComplete] = useState(false);
  
  // Use a ref to track the last calculated trip ID to avoid recalculating
  // when switching between components that use the same store
  const lastCalculatedTripRef = React.useRef<string | null>(null);
  
  useEffect(() => {
    // Only run this once per tripId
    if (
      !calculationInProgress && 
      !calculationComplete && 
      tripId && 
      Object.keys(memberMap).length > 0 &&
      lastCalculatedTripRef.current !== tripId &&
      expenses.length > 0
    ) {
      const calculateSettlements = async () => {
        try {
          setCalculationInProgress(true);
          console.log("SettlementSummary: Calculating settlements for tripId:", tripId);
          
          // Filter expenses for this trip
          const tripExpenses = expenses.filter(expense => expense.tripId === tripId);
          
          if (tripExpenses.length === 0) {
            console.log("No expenses found for this trip");
            setCalculationInProgress(false);
            setCalculationComplete(true);
            lastCalculatedTripRef.current = tripId;
            return;
          }
          
          const storeResults = await calculateOptimizedSettlements(tripId);
          
          // Convert store settlements to display settlements with user details
          const displaySettlements = storeResults.map(settlement => ({
            from: memberMap[settlement.fromUserId]?.displayName || settlement.fromUserId,
            fromDetails: memberMap[settlement.fromUserId],
            to: memberMap[settlement.toUserId]?.displayName || settlement.toUserId,
            toDetails: memberMap[settlement.toUserId],
            amount: settlement.amount
          }));
          
          setSettlements(displaySettlements);
          lastCalculatedTripRef.current = tripId;
          setCalculationComplete(true);
          
          // Only show a toast if there are settlements needed
          if (displaySettlements.length > 0) {
            toast.info(
              `${displaySettlements.length} ${displaySettlements.length === 1 ? 'settlement' : 'settlements'} calculated`,
              {
                description: "The optimal settlements have been calculated to help everyone settle up.",
                position: "top-right"
              }
            );
          }
        } catch (error) {
          console.error("Error calculating settlements:", error);
        } finally {
          setCalculationInProgress(false);
        }
      };
      
      calculateSettlements();
    }
  }, [
    calculationInProgress,
    calculationComplete,
    tripId, 
    memberMap, 
    expenses,
    calculateOptimizedSettlements
  ]);
  
  if (isLoadingMembers || calculationInProgress || isLoading) {
    return (
      <div className="py-4 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)] mx-auto"></div>
        <p className="text-center mt-2 text-[var(--muted-foreground)]">
          {isLoadingMembers 
            ? 'Loading member data...' 
            : calculationInProgress 
              ? 'Calculating final settlements...'
              : 'Processing expenses...'}
        </p>
      </div>
    );
  }
  
  if (!settlements || settlements.length === 0) {
    return (
      <div className="p-4 bg-[var(--muted)] rounded-lg w-full">
        <p className="text-center text-[var(--muted-foreground)]">No settlements needed! Everyone is square.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 w-full">
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        These are the optimized payments needed to settle all expenses.
      </p>
      
      <div className="grid gap-3">
        {settlements.map((settlement, index) => (
          <div key={index} className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm p-3">
            {/* Desktop View */}
            <div className="hidden sm:flex flex-row items-center">
              <div className="flex-1 flex flex-row items-center gap-2">
                <Avatar className="h-10 w-10 border border-[var(--border)]">
                  <AvatarImage src={settlement.fromDetails?.photoURL} alt={settlement.from} />
                  <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)]">
                    {settlement.from?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-medium truncate max-w-[120px]">{settlement.from}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">pays</p>
                </div>
              </div>
              <div className="flex items-center text-[#00A63E] font-bold px-4">
                {trip.currency} {settlement.amount.toFixed(2)}
              </div>
              <div className="flex-1 flex flex-row-reverse items-center gap-2">
                <Avatar className="h-10 w-10 border border-[var(--border)]">
                  <AvatarImage src={settlement.toDetails?.photoURL} alt={settlement.to} />
                  <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)]">
                    {settlement.to?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="font-medium truncate max-w-[120px]">{settlement.to}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">receives</p>
                </div>
              </div>
            </div>
            
            {/* Mobile View */}
            <div className="flex flex-col sm:hidden">
              {/* Avatars and arrow row */}
              <div className="flex justify-center items-center mb-2 w-full">
                {/* From Avatar */}
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-[var(--border)]">
                    <AvatarImage src={settlement.fromDetails?.photoURL} alt={settlement.from} />
                    <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)]">
                      {settlement.from?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-[var(--background)] rounded-full px-1 text-xs border border-[var(--border)] whitespace-nowrap">
                    pays
                  </div>
                </div>
                
                {/* Arrow with amount */}
                <div className="mx-3">
                  <div className="flex flex-col items-center">
                    <div className="px-3 py-1 bg-[var(--primary)]/10 rounded-lg mb-1">
                      <p className="text-[var(--primary)] font-bold text-sm whitespace-nowrap">
                        {trip.currency} {settlement.amount.toFixed(2)}
                      </p>
                    </div>
                    <svg width="24" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[var(--primary)]">
                      <path d="M13.75 6.75L19.25 12L13.75 17.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 12H4.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                {/* To Avatar */}
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-[var(--border)]">
                    <AvatarImage src={settlement.toDetails?.photoURL} alt={settlement.to} />
                    <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)]">
                      {settlement.to?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-[var(--background)] rounded-full px-1 text-xs border border-[var(--border)] whitespace-nowrap">
                    receives
                  </div>
                </div>
              </div>
              
              {/* Names row - collapsible/expandable */}
              <div className="text-xs text-[var(--muted-foreground)] text-center mt-2">
                <p className="font-medium truncate max-w-full">
                  <span className="font-semibold text-[var(--foreground)]">{settlement.from}</span> pays 
                  <span className="font-semibold text-[var(--primary)]"> {trip.currency} {settlement.amount.toFixed(2)} </span>
                  to <span className="font-semibold text-[var(--foreground)]">{settlement.to}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
