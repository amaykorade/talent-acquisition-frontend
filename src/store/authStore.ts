import { create } from 'zustand';
import { auth } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  fetchSignInMethodsForEmail
} from 'firebase/auth';

interface AuthState {
  user: any | null;
  loading: boolean;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkEmailExists: (email: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  register: async (email, password, name, phone) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: name,
        phoneNumber: phone
      });
      set({ user: userCredential.user });
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },
  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ user: userCredential.user });
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ user: null });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
  checkEmailExists: async (email) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  }
}));

// Set up auth state listener
onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, loading: false });
});