'use client';

import React, { useState, useEffect } from 'react';
import { useExpenseStore, Settlement as StoreSettlement } from '@/stores/useExpenseStore';
import { Trip } from '@/stores/useTripStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

interface SettlementProps {
  tripId: string;
  trip: Trip;
}

interface DisplaySettlement {
  from: string;
  to: string;
  amount: number;
}

export default function SettlementSummary({ tripId, trip }: SettlementProps) {
  const [settlements, setSettlements] = useState<DisplaySettlement[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const { calculateOptimizedSettlements, expenses, isLoading } = useExpenseStore();
  
  // We will NOT fetch expenses in this component - the parent component should handle that
  // This removes the circular dependency between components
  
  // Fetch member data to display names instead of IDs
  useEffect(() => {
    const fetchMemberData = async () => {
      setIsLoadingMembers(true);
      try {
        const userMap: Record<string, string> = {};
        
        // Get all member IDs from the trip
        if (trip.members && trip.members.length > 0) {
          await Promise.all(
            trip.members.map(async (memberId) => {
              try {
                const userDoc = await getDoc(doc(db, "users", memberId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  userMap[memberId] = userData.displayName || userData.email || "Unknown User";
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
          
          // Convert store settlements to display settlements with actual names
          const displaySettlements = storeResults.map(settlement => ({
            from: memberMap[settlement.fromUserId] || settlement.fromUserId, 
            to: memberMap[settlement.toUserId] || settlement.toUserId,
            amount: settlement.amount
          }));
          
          setSettlements(displaySettlements);
          lastCalculatedTripRef.current = tripId;
          setCalculationComplete(true);
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
      <div className="py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-center mt-2 text-gray-600">
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
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-center text-gray-600">No settlements needed! Everyone is square.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-medium">Final Settlements</h3>
      <p className="text-sm text-gray-600 mb-4">
        These are the optimized payments needed to settle all expenses.
      </p>
      
      <div className="grid gap-3">
        {settlements.map((settlement, index) => (
          <div key={index} className="flex items-center p-3 bg-white border rounded-lg shadow-sm">
            <div className="flex-1">
              <p className="font-medium">{settlement.from}</p>
              <p className="text-sm text-gray-600">pays</p>
            </div>
            <div className="flex items-center text-green-600 font-bold px-4">
              {trip.currency} {settlement.amount.toFixed(2)}
            </div>
            <div className="flex-1 text-right">
              <p className="font-medium">{settlement.to}</p>
              <p className="text-sm text-gray-600">receives</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
