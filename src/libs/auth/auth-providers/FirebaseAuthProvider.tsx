// TODO: Check ts errors

import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { User } from '..';
import IAuthProvider, { IAuthProviderOptions } from './IAuthProvider';

// TODO: Implement return [result, error] pattern

class FirebaseAuthProvider extends IAuthProvider {
  constructor(options: IAuthProviderOptions, providerOptions?: any) {
    super(options, providerOptions);

    this.provider = 'FIREBASE';
  }

  getDemoUser(): { username: string; password: string } {
    return { username: 'demo@demo.com', password: 'demo123' };
  }

  getSignInPath() {
    return this.options.login;
  }

  getSignOutPath() {
    return this.options.logout;
  }

  async signUp(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(getAuth(), email, password);
    return userCredential.user;
  }

  async signIn(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
    return userCredential.user;
  }

  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();

    await signInWithPopup(getAuth(), provider);
  }

  async signOut() {
    return signOut(getAuth());
  }

  onAuthStateChanged(callback: () => any) {
    return () => onAuthStateChanged(getAuth(), callback);
  }

  reauthenticate = async (password: string) => {
    const user = getAuth().currentUser;
    if (!user) {
      throw new Error('User not found');
    }
    const credential = EmailAuthProvider.credential(user.email as string, password);
    await reauthenticateWithCredential(user, credential);
  };

  getCurrentUser(): User | null {
    const user = getAuth().currentUser;
    if (user) {
      return {
        id: user.uid,
        avatar: user.photoURL || undefined,
        email: user.email || 'user@demo.com',
        name: user.displayName || 'Unknown user',
        raw: user,
      };
    }
    return null;
  }

  async updateProfile(user: User): Promise<User> {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      throw new Error('User not found');
    }
    await updateProfile(currentUser, {
      displayName: user.name,
      photoURL: user.avatar,
    });
    return user;
  }

  updatePassword = async (oldpassword: string, newPassword: string) => {
    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      throw new Error('User not found');
    }
    await this.reauthenticate(oldpassword);
    await updatePassword(currentUser, newPassword);
  };

  async setPasswordResetMail(email: string) {
    await sendPasswordResetEmail(getAuth(), email);
  }
}

export default FirebaseAuthProvider;
