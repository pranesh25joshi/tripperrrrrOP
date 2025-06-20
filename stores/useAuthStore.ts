import { GoogleAuthProvider , signInWithPopup, signOut , onAuthStateChanged } from "firebase/auth";
import { create } from "zustand";
import { auth , db} from "@/firebase/firebaseConfig";
import {doc, setDoc , getDoc} from "firebase/firestore";

export interface UserProfile {
    uid: string;
    email: string;
    displayname: string;
    photoURL: string;
    phoneNumber?: string;
    createdAt?: string;
}

export interface AuthState {
    user : UserProfile | null;
    loading : boolean;
    error : string | null;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) =>({
    user:null,
    loading: true,
    error: null,

    signInWithGoogle: async () => {
        try {
            set({loading: true, error: null});
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

            // abb save karuga firebase base peeee
            // sheeeeeerrrrr

            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, userProfile, { merge: true });
            set({ user: userProfile, loading: false, error: null });
        } catch (error) {
            console.error("Error signing in with Google:", error);
            set({ loading: false, error: error instanceof Error ? error.message : "An error occurred" });



        }
    },

    logout: async ()=> {
         try{
            set({loading: true, error: null});
            await signOut(auth);
            set({ user: null, loading: false, error: null });
         }
         catch(error){
            console.error("Error signing out:", error);
            set({ loading: false, error: error instanceof Error ? error.message : "An error occurred" });
         }
    },

    initializeAuth: () => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                console.log("User reference:", userRef);

                const userDoc = await getDoc(userRef);
                console.log("User document data:", userDoc.data());

                if (userDoc.exists()) {
                    // userdata exists in firebase
                    const userData = userDoc.data() as UserProfile;
                    set({ user: userData, loading: false, error: null });
                } else {
                    // means new user is detected 
                    const newUserProfile:UserProfile= {
                        uid: user.uid,
                        email: user.email || "",
                        displayname: user.displayName || "",
                        photoURL: user.photoURL || "",
                        phoneNumber: user.phoneNumber || "",
                        createdAt: new Date().toISOString()
                    };

                    await setDoc(userRef, newUserProfile, { merge: true });
                    set({user:newUserProfile, loading: false, error: null});
                }
            } else {
                // no user signed in
                set({ user: null, loading: false, error: null });
            }
        });
    }
}));
