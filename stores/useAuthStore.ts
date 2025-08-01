import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, Unsubscribe } from "firebase/auth";
import { create } from "zustand";
import { auth, db } from "@/firebase/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

export interface UserProfile {
    uid: string;
    email: string;
    displayname: string;
    photoURL: string;
    phoneNumber?: string;
    createdAt?: string;
}

export interface AuthState {
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
    initialized: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    initializeAuth: () => () => void; // Return unsubscribe function
    isAuthenticated: () => boolean;
}

// Keep track of the auth unsubscribe function outside the store
let authUnsubscribe: Unsubscribe | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    loading: true,
    error: null,
    initialized: false,

    signInWithGoogle: async () => {
        try {
            set({ loading: true, error: null });
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            const user = result.user;

            const userProfile: UserProfile = { 
                uid: user.uid,
                email: user.email || "",
                displayname: user.displayName || "",
                photoURL: user.photoURL || "",
                phoneNumber: user.phoneNumber || "",
                createdAt: new Date().toISOString()
            }

            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, userProfile, { merge: true });
            set({ user: userProfile, loading: false, error: null });
        } catch (error) {
            console.error("Error signing in with Google:", error);
            set({ loading: false, error: error instanceof Error ? error.message : "An error occurred" });
        }
    },

    logout: async () => {
        try {
            set({ loading: true, error: null });
            await signOut(auth);
            set({ user: null, loading: false, error: null });
        }
        catch (error) {
            console.error("Error signing out:", error);
            set({ loading: false, error: error instanceof Error ? error.message : "An error occurred" });
        }
    },

    isAuthenticated: () => {
        const state = get();
        return Boolean(state.user) && !state.loading && state.initialized;
    },

    initializeAuth: () => {
        // If we already have an active listener, don't create a new one
        if (authUnsubscribe) {
            console.log("Auth already initialized, reusing existing listener");
            return authUnsubscribe;
        }
        
        console.log("Setting up new auth listener");
        set({ loading: true });
        
        // Set up the auth state listener
        authUnsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed:", user ? `User: ${user.uid}` : "No user");
            
            if (user) {
                const userRef = doc(db, "users", user.uid);
                
                try {
                    const userDoc = await getDoc(userRef);
                    
                    if (userDoc.exists()) {
                        // User data exists in Firestore
                        const userData = userDoc.data() as UserProfile;
                        set({ user: userData, loading: false, error: null, initialized: true });
                    } else {
                        // New user detected
                        const newUserProfile: UserProfile = {
                            uid: user.uid,
                            email: user.email || "",
                            displayname: user.displayName || "",
                            photoURL: user.photoURL || "",
                            phoneNumber: user.phoneNumber || "",
                            createdAt: new Date().toISOString()
                        };

                        await setDoc(userRef, newUserProfile, { merge: true });
                        set({ user: newUserProfile, loading: false, error: null, initialized: true });
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    set({ 
                        loading: false, 
                        error: error instanceof Error ? error.message : "Failed to fetch user data",
                        initialized: true 
                    });
                }
            } else {
                // No user signed in
                set({ user: null, loading: false, error: null, initialized: true });
            }
        });
        
        return authUnsubscribe;
    }
}));
