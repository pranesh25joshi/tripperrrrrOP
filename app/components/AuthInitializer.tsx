'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * AuthInitializer component
 * 
 * This component initializes authentication once at the app root level
 * and ensures the auth listener is properly set up and cleaned up.
 */
export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initializeAuth, initialized } = useAuthStore();
  
  useEffect(() => {
    // Set up the auth listener and store the unsubscribe function
    const unsubscribe = initializeAuth();
    
    // Clean up the listener when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initializeAuth]);

  return <>{children}</>;
}
