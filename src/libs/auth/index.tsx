import CompositeAuthProvider from './auth-providers/CompositeAuthProvider';
import FirebaseAuthProvider from './auth-providers/FirebaseAuthProvider';
import { AuthConsumer, AuthProvider } from './context';
import useAuth from './use-auth';
import useLoginForm from './use-login-form';

export {
  AuthConsumer,
  AuthProvider,
  CompositeAuthProvider,
  FirebaseAuthProvider,
  useAuth,
  useLoginForm,
};

export interface User {
  id: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  avatar?: string;
  phone?: string;
  providerId?: string;
  raw: any;
}

// TODO: fix typescript typings for auth lib

export interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user?: User | null;
  raw: any;
  options: any;
  provider?: string | null;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle?: () => Promise<void>;
  signOut: () => Promise<void>;
  onAuthStateChanged?: (user: any) => () => void;
  getCurrentUser?: () => User | null;
  updateProfile?: (profile: User) => Promise<User>;
  updatePassword?: (oldPassword: string, newPassword: string) => Promise<void>;
  sendPasswordResetEmail?: (email: string) => Promise<void>;
}
