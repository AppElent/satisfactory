// TODO: Check ts errors

export interface IAuthProviderOptions {
  login: string;
  logout: string;
}

class IAuthProvider {
  public provider: string;

  constructor(
    public options: IAuthProviderOptions,
    public providerOptions?: any
  ) {
    this.provider = 'Base';
  }

  getDemoUser(): { username: string; password: string } {
    throw new Error('Method not implemented.');
  }

  getSignInPath() {
    throw new Error('Method not implemented.');
  }

  getSignOutPath() {
    throw new Error('Method not implemented.');
  }

  signUp(_email: string, _password: string) {
    throw new Error('Method not implemented.');
  }

  signIn(_email: string, _password: string) {
    throw new Error('Method not implemented.');
  }

  signInWithGoogle() {
    throw new Error('Method not implemented.');
  }

  signOut() {
    throw new Error('Method not implemented.');
  }

  onAuthStateChanged(_user: any) {
    throw new Error('Method not implemented.');
  }

  getCurrentUser() {
    throw new Error('Method not implemented.');
  }

  updateProfile(_profile: any) {
    throw new Error('Method not implemented.');
  }

  updatePassword(_oldPassword: string, _newPassword: string) {
    throw new Error('Method not implemented.');
  }

  resetPassword(_email: string) {
    throw new Error('Method not implemented.');
  }
}

export default IAuthProvider;
