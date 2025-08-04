'use client';

import { useState, useEffect } from 'react';
import { useExpenseStore } from '@/stores/useExpenseStore';
import { format } from 'date-fns';
import { FaPlus } from 'react-icons/fa';
import { 
  FaUtensils, FaHotel, FaShoppingBag, 
  FaPlane, FaTicketAlt, FaTaxi, 
  FaCoffee, FaGasPump, FaMedkit, 
  FaMoneyBillWave 
} from 'react-icons/fa';
import AddExpenseModal from '@/app/trips/[tripId]/AddExpenseModal';

// Use the actual Expense interface from the store
import { Expense as StoreExpense } from '@/stores/useExpenseStore';

// Extend the interface to handle both displayName and displayname
interface ExtendedCreatedBy {
  uid: string;
  displayName?: string;
  displayname?: string;
  photoURL: string;
}

interface TripMember {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

interface ExpenseListProps {
  tripId: string;
  tripCurrency?: string;
  members?: TripMember[];
  readOnly?: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  food: <FaUtensils className="text-orange-500" />,
  accommodation: <FaHotel className="text-blue-500" />,
  shopping: <FaShoppingBag className="text-purple-500" />,
  transport: <FaPlane className="text-cyan-500" />,
  activities: <FaTicketAlt className="text-green-500" />,
  taxi: <FaTaxi className="text-yellow-500" />,
  coffee: <FaCoffee className="text-brown-500" />,
  fuel: <FaGasPump className="text-red-500" />,
  health: <FaMedkit className="text-rose-500" />,
  other: <FaMoneyBillWave className="text-gray-500" />
};

export default function ExpenseList({ 
  tripId, 
  tripCurrency = 'USD', 
  members = [], 
  readOnly = false 
}: ExpenseListProps) {
  const { expenses, isLoading, error, fetchExpenses } = useExpenseStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  
  // Fetch expenses when the component mounts
  useEffect(() => {
    const loadExpenses = async () => {
      console.log('ExpenseList: Fetching expenses for tripId:', tripId);
      setLocalLoading(true);
      await fetchExpenses(tripId);
      setLocalLoading(false);
    };
    
    if (tripId) {
      loadExpenses();
    }
  }, [tripId, fetchExpenses]);

  // Log when expenses change
  useEffect(() => {
    console.log('ExpenseList: Expenses updated, count:', expenses.length);
  }, [expenses]);

  // Group expenses by date
  const groupedExpenses: Record<string, StoreExpense[]> = {};
  
  expenses.forEach(expense => {
    try {
      // Handle Firebase Timestamp objects with more error checking
      let expenseDate;
      
      if (expense.date instanceof Date) {
        expenseDate = expense.date;
      } else if (expense.date && typeof expense.date.toDate === 'function') {
        expenseDate = expense.date.toDate();
      } else if (expense.date && typeof expense.date === 'object' && 'seconds' in expense.date) {
        // Handle Firestore timestamp format in local storage
        expenseDate = new Date(expense.date.seconds * 1000);
      } else {
        // Fallback to current date if date is invalid
        expenseDate = new Date();
        console.warn('Invalid date format for expense:', expense.id);
      }
      
      const dateKey = format(expenseDate, 'MMMM d, yyyy');
      if (!groupedExpenses[dateKey]) {
        groupedExpenses[dateKey] = [];
      }
      groupedExpenses[dateKey].push(expense);
    } catch (err) {
      console.error('Error processing expense date:', err, expense);
      // Add to "Unknown Date" group as fallback
      const dateKey = 'Unknown Date';
      if (!groupedExpenses[dateKey]) {
        groupedExpenses[dateKey] = [];
      }
      groupedExpenses[dateKey].push(expense);
    }
  });

  // Sort dates in reverse chronological order
  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="relative pb-20">
      {(isLoading && expenses.length === 0) || localLoading ? (
        <div className="py-4 animate-pulse">
          {/* Expense items skeleton */}
          <div className="mb-6">
            <div className="h-5 w-24 bg-gray-200 rounded mb-3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between p-3 border border-gray-200 rounded-lg bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-gray-200 rounded"></div>
                      <div className="h-4 w-24 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded self-center"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8">
            <div className="h-5 w-24 bg-gray-200 rounded mb-3"></div>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex justify-between p-3 border border-gray-200 rounded-lg bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                    <div className="space-y-2">
                      <div className="h-5 w-32 bg-gray-200 rounded"></div>
                      <div className="h-4 w-24 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded self-center"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-yellow-50 text-amber-700 rounded-lg mb-4">
          <p className="mb-2 font-medium">{error}</p>
          {error.includes("Firebase index") && (
            <>
              <p className="text-sm mb-2">This happens the first time you view a trip's expenses.</p>
              <p className="text-sm">Your existing expenses will appear automatically once the index is ready.</p>
            </>
          )}
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FaMoneyBillWave className="inline-block text-6xl" />
          </div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">No expenses yet</h3>
          <p className="text-gray-500">
            Click the + button below to add your first expense
          </p>
        </div>
      ) : (
        <div>
          {sortedDates.map(date => (
            <div key={date} className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">
                {date}
              </h3>
              <div className="space-y-3">
                {groupedExpenses[date].map(expense => (
                  <div 
                    key={expense.id} 
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="flex items-start">
                      <div className="p-3 bg-gray-50 rounded-lg mr-4">
                        {categoryIcons[expense.category] || categoryIcons.other}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {expense.name}
                        </h4>
                        <p className="text-gray-500 text-sm line-clamp-2">
                          {expense.description}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <span>Added by {expense.createdBy?.displayName || 'Unknown'}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4 text-right">
                        <div className="text-lg font-semibold">
                          {expense.amount.toLocaleString(undefined, {
                            style: 'currency',
                            currency: expense.currency
                          })}
                        </div>
                        {expense.currency !== tripCurrency && (
                          <div className="text-xs text-gray-500">
                            {/* Placeholder for currency conversion */}
                            ≈ {(expense.amount).toLocaleString(undefined, {
                              style: 'currency',
                              currency: tripCurrency
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Expense Button - Fixed at bottom */}
      {!readOnly && (
        <div className="fixed bottom-6 left-0 w-full flex justify-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="h-14 w-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition"
            aria-label="Add expense"
          >
            <FaPlus className="text-xl" />
          </button>
        </div>
      )}
      
      {/* Add Expense Modal */}
      {!readOnly && showAddModal && (
        <AddExpenseModal
          tripId={tripId}
          tripCurrency={tripCurrency}
          members={members}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
