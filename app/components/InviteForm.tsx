'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTripStore } from '@/stores/useTripStore';
import { toast } from "sonner";

interface InviteFormProps {
  tripId: string;
  onClose?: () => void;
}

export default function InviteForm({ tripId, onClose }: InviteFormProps) {
  const [emailInput, setEmailInput] = useState<string>('');
  const [emailChips, setEmailChips] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const { sendTripInvitations } = useTripStore();
  
  // Focus input field when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle adding new email as a chip
  const handleAddEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      
      // Get input and remove trailing comma if any
      const input = emailInput.trim().replace(/,$/, '');
      
      // If input is empty, don't do anything
      if (!input) return;
      
      // Handle potential multiple emails in one input (for mobile especially)
      const emailsToAdd = input.split(/[,\s]+/).filter(e => e.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      let addedCount = 0;
      let invalidEmails: string[] = [];
      
      emailsToAdd.forEach(email => {
        if (emailRegex.test(email) && !emailChips.includes(email)) {
          setEmailChips(prev => [...prev, email]);
          addedCount++;
        } else if (!emailRegex.test(email)) {
          invalidEmails.push(email);
        }
      });
      
      if (addedCount > 0) {
        setEmailInput('');
        setError('');
      }
      
      if (invalidEmails.length > 0) {
        setError(`Invalid email format: ${invalidEmails.join(', ')}`);
      }
    }
  };
  
  // Handle pasting multiple emails
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    
    // Split pasted text by commas, spaces or newlines
    const emails = pastedText.split(/[,\s\n]+/).filter(email => email.trim());
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emails.filter(email => emailRegex.test(email));
    const invalidEmails = emails.filter(email => email && !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      setError(`Invalid email format: ${invalidEmails.join(', ')}`);
    }
    
    if (validEmails.length > 0) {
      // Filter out duplicates
      const newEmails = validEmails.filter(email => !emailChips.includes(email));
      setEmailChips([...emailChips, ...newEmails]);
    }
  };
  
  // Remove an email chip
  const removeEmailChip = (emailToRemove: string) => {
    setEmailChips(emailChips.filter(email => email !== emailToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to send invitations');
      return;
    }
    
    // Add the current input if it's valid
    if (emailInput.trim()) {
      const input = emailInput.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      // Handle multiple emails separated by commas or spaces
      const emailsToAdd = input.split(/[,\s]+/).filter(e => e.trim());
      let newEmails: string[] = [];
      
      emailsToAdd.forEach(email => {
        if (emailRegex.test(email) && !emailChips.includes(email) && !newEmails.includes(email)) {
          newEmails.push(email);
        }
      });
      
      if (newEmails.length > 0) {
        setEmailChips(prev => [...prev, ...newEmails]);
        setEmailInput('');
      }
    }
    
    if (emailChips.length === 0) {
      setError('Please enter at least one valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await sendTripInvitations(
        tripId,
        emailChips,
        user.displayname || 'Trip Member',
        user.email
      );
      
      toast.success(`Invitations sent!`, {
        description: `${emailChips.length} ${emailChips.length === 1 ? 'person' : 'people'} invited to join your trip.`,
        position: "top-right"
      });
      
      setSuccessMessage(`Invitations sent to ${emailChips.join(', ')}`);
      setEmailChips([]);
      setEmailInput('');
      
      // Close modal after short delay if onClose provided
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg w-full max-w-lg mx-auto">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-1">Who's coming?</h2>
        <p className="text-gray-500 text-sm">
          Add participants to share expenses with
        </p>
      </div>
      
      {successMessage && (
        <div className="mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-green-700 text-sm sm:text-base">{successMessage}</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-red-700 text-sm sm:text-base">{error}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="emails" className="block text-sm font-medium text-gray-700 mb-2">
            Email Addresses
          </label>
          <div className="relative">
            <div className="flex items-center">
              <input
                ref={inputRef}
                id="emailInput"
                type="text"
                className="w-full px-4 py-3 bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-all"
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={handleAddEmail}
                onPaste={handlePaste}
                disabled={isSubmitting}
                aria-label="Email input"
              />
              <button
                type="button"
                className="absolute right-0 bg-black text-white p-3 rounded-r-md hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                onClick={() => {
                  if (emailInput.trim()) {
                    // Split by spaces or commas in case user is on mobile and typed multiple emails
                    const emailsToAdd = emailInput.trim().split(/[,\s]+/).filter(e => e.trim());
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    
                    let addedCount = 0;
                    let invalidEmails: string[] = [];
                    
                    emailsToAdd.forEach(email => {
                      if (emailRegex.test(email) && !emailChips.includes(email)) {
                        setEmailChips(prev => [...prev, email]);
                        addedCount++;
                      } else if (!emailRegex.test(email)) {
                        invalidEmails.push(email);
                      }
                    });
                    
                    if (addedCount > 0) {
                      setEmailInput('');
                      setError('');
                    }
                    
                    if (invalidEmails.length > 0) {
                      setError(`Invalid email format: ${invalidEmails.join(', ')}`);
                    }
                  }
                }}
                disabled={isSubmitting || !emailInput.trim()}
                aria-label="Add email"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Email chips display */}
          {emailChips.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Participants ({emailChips.length})</p>
              <div className="flex flex-wrap gap-2">
                {emailChips.map((email, index) => (
                  <div 
                    key={index}
                    className="bg-gray-100 py-1.5 px-3 rounded-full flex items-center gap-2 transition-colors hover:bg-gray-200"
                  >
                    <span className="text-sm truncate max-w-[180px] sm:max-w-[220px]">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmailChip(email)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500 rounded-full p-0.5"
                      disabled={isSubmitting}
                      aria-label={`Remove ${email}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="p-3 sm:p-4 bg-gray-50 rounded-md text-xs sm:text-sm text-gray-600 mt-4 border border-gray-100">
            <div className="flex items-start sm:items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 mt-0.5 sm:mt-0">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>
                Don't worry, you can add more participants later or share an invite link after creating the trip.
                <ul className="mt-2 ml-4 list-disc text-gray-600">
                  <li>Enter multiple emails separated by spaces or commas</li>
                  <li>Press the <span className="font-medium">+</span> button to add emails</li>
                  <li>You can also paste multiple emails at once</li>
                  <li>On desktop: press <span className="font-medium">Enter</span>, <span className="font-medium">Space</span> or type <span className="font-medium">comma (,)</span> to add email</li>
                </ul>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between pt-6 gap-3">
          <button
            type="button"
            className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
            
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-black"
            disabled={isSubmitting || emailChips.length === 0}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : "Send Invitations"}
          </button>
        </div>
      </form>
    </div>
  );
}
