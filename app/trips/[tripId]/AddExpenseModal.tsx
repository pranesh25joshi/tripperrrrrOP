'use client';

import { useState, useEffect } from 'react';
import { useExpenseStore, ExpenseShare } from '@/stores/useExpenseStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { FaTimes, FaUserFriends, FaEquals, FaDivide } from 'react-icons/fa';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from "sonner";
import { announceExpense } from '@/lib/tts';

interface TripMember {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

interface AddExpenseModalProps {
  tripId: string;
  tripCurrency: string;
  members: TripMember[];
  onClose: () => void;
}

const categories = [
  { id: 'food', name: 'Food & Drink' },
  { id: 'accommodation', name: 'Accommodation' },
  { id: 'transport', name: 'Transport' },
  { id: 'activities', name: 'Activities' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'taxi', name: 'Taxi' },
  { id: 'coffee', name: 'Coffee' },
  { id: 'fuel', name: 'Fuel' },
  { id: 'health', name: 'Health' },
  { id: 'other', name: 'Other' },
];

export default function AddExpenseModal({ tripId, tripCurrency, members, onClose }: AddExpenseModalProps) {
  const { addExpense, isLoading } = useExpenseStore();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    currency: tripCurrency,
    date: new Date().toISOString().split('T')[0],
    category: 'other',
    splitType: 'equal' // 'equal' or 'custom'
  });
  
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});
  const [splitShares, setSplitShares] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  
  // Initialize selected members with the current user
  useEffect(() => {
    if (user && members.length > 0) {
      const initialSelected: Record<string, boolean> = {};
      const initialShares: Record<string, string> = {};
      
      // Select all members by default
      members.forEach(member => {
        initialSelected[member.uid] = true;
        initialShares[member.uid] = '';
      });
      
      setSelectedMembers(initialSelected);
      setSplitShares(initialShares);
    }
  }, [user, members]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset split shares when amount changes
    if (name === 'amount') {
      const amount = Number(value || 0);
      const selectedMemberIds = Object.entries(selectedMembers)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      
      if (selectedMemberIds.length > 0 && formData.splitType === 'equal') {
        const amountPerPerson = amount / selectedMemberIds.length;
        
        const newShares: Record<string, string> = {};
        for (const id of selectedMemberIds) {
          newShares[id] = amountPerPerson.toFixed(2);
        }
        
        setSplitShares(newShares);
      }
    }
    
    // Update split shares when split type changes
    if (name === 'splitType') {
      const selectedMemberIds = Object.entries(selectedMembers)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);
      
      if (value === 'equal' && selectedMemberIds.length > 0) {
        const amount = Number(formData.amount || 0);
        const amountPerPerson = amount / selectedMemberIds.length;
        
        const newShares: Record<string, string> = {};
        for (const id of selectedMemberIds) {
          newShares[id] = amountPerPerson.toFixed(2);
        }
        
        setSplitShares(newShares);
      }
    }
  };

  // Toggle member selection
  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  // Handle split share changes
  const handleSplitShareChange = (memberId: string, value: string) => {
    setSplitShares(prev => ({
      ...prev,
      [memberId]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('Please enter an expense name');
      return;
    }
    
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to add an expense');
      return;
    }
    
    // Check if any members are selected
    const selectedMemberIds = Object.entries(selectedMembers)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);
    
    if (selectedMemberIds.length === 0) {
      setError('Please select at least one member to split with');
      return;
    }
    
    // Calculate split shares
    let splitBetween: ExpenseShare[] = [];
    
    if (formData.splitType === 'equal') {
      // Equal split
      const amountPerPerson = Number(formData.amount) / selectedMemberIds.length;
      
      splitBetween = selectedMemberIds.map(userId => ({
        userId,
        amount: amountPerPerson
      }));
    } else {
      // Custom split
      // Validate all selected members have valid amounts
      let totalShares = 0;
      
      for (const memberId of selectedMemberIds) {
        const shareAmount = splitShares[memberId].trim();
        
        if (!shareAmount || isNaN(Number(shareAmount)) || Number(shareAmount) <= 0) {
          setError(`Please enter a valid amount for all selected members`);
          return;
        }
        
        totalShares += Number(shareAmount);
      }
      
      // Check if shares add up to total
      if (Math.abs(totalShares - Number(formData.amount)) > 0.01) {
        setError(`The sum of shares (${totalShares}) doesn't match the total expense (${formData.amount})`);
        return;
      }
      
      splitBetween = selectedMemberIds.map(userId => ({
        userId,
        amount: Number(splitShares[userId])
      }));
    }
    
    try {
      await addExpense({
        tripId,
        name: formData.name,
        description: formData.description,
        amount: Number(formData.amount),
        currency: formData.currency,
        date: formData.date,
        category: formData.category,
        paidBy: user.uid,
        splitBetween,
        createdBy: {
          uid: user.uid,
          displayName: user.displayname,
          photoURL: user.photoURL
        }
      });
      
      toast.success(`Expense "${formData.name}" added!`, {
        description: `${formData.currency} ${Number(formData.amount).toFixed(2)} added to trip.`,
        position: "top-right"
      });
      
      // Voice announcement
      console.log('🔊 About to announce expense:', formData.name, Number(formData.amount), user.displayname);
      announceExpense(Number(formData.amount), formData.name, user.displayname || 'Unknown');
      
      // Small delay to allow voice to start before closing modal
      setTimeout(() => {
        onClose();
      }, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center sm:items-center px-4">
      <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b flex justify-between items-center rounded-t-xl">
          <h2 className="text-xl font-semibold">Add Expense</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-32 sm:pb-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Expense Name*
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Dinner at Night Market"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add details about this expense"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount*
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={tripCurrency}>{tripCurrency}</option>
                {/* <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="JPY">JPY</option>
                <option value="CNY">CNY</option> */}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Split options */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-800 flex items-center">
              <FaUserFriends className="mr-2 text-blue-500" />
              Split with
            </h3>
            
            <div className="flex mb-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, splitType: 'equal' }))}
                className={`flex-1 py-2 px-3 flex justify-center items-center border ${
                  formData.splitType === 'equal' 
                    ? 'bg-blue-50 border-blue-500 text-blue-600' 
                    : 'border-gray-300 text-gray-700'
                } rounded-l-md`}
              >
                <FaEquals className="mr-2" /> 
                Equal Split
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, splitType: 'custom' }))}
                className={`flex-1 py-2 px-3 flex justify-center items-center border ${
                  formData.splitType === 'custom' 
                    ? 'bg-blue-50 border-blue-500 text-blue-600' 
                    : 'border-gray-300 text-gray-700'
                } rounded-r-md border-l-0`}
              >
                <FaDivide className="mr-2" />
                Custom Split
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="mb-2 text-sm font-medium text-gray-600">
                Select members to split with:
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {members.map(member => (
                  <div key={member.uid} className="flex items-center justify-between bg-white p-2 rounded-md border">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`member-${member.uid}`}
                        checked={selectedMembers[member.uid] || false}
                        onChange={() => toggleMember(member.uid)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`member-${member.uid}`} className="flex items-center cursor-pointer">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={member.photoURL} />
                          <AvatarFallback>{member.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{member.displayName || member.email?.split('@')[0]}</span>
                      </label>
                    </div>
                    
                    {formData.splitType === 'custom' && selectedMembers[member.uid] && (
                      <div className="w-24">
                        <input
                          type="number"
                          value={splitShares[member.uid] || ''}
                          onChange={(e) => handleSplitShareChange(member.uid, e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Amount"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding Expense...
                </span>
              ) : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
