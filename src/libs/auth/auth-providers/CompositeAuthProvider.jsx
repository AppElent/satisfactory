import IAuthProvider from './IAuthProvider';

class CompositeAuthProvider extends IAuthProvider {
  constructor(providers) {
    super();
    this.providers = providers;
  }

  async signUp(email, password) {
    const results = await Promise.all(
      this.providers.map((provider) => provider.signUp(email, password))
    );
    return results;
  }

  async signIn(email, password) {
    const results = await Promise.all(
      this.providers.map((provider) => provider.signIn(email, password))
    );
    return results;
  }

  async signOut() {
    await Promise.all(this.providers.map((provider) => provider.signOut()));
  }

  async getCurrentUser() {
    const results = await Promise.all(this.providers.map((provider) => provider.getCurrentUser()));
    return results;
  }

  async resetPassword(email) {
    await Promise.all(this.providers.map((provider) => provider.resetPassword(email)));
  }
}

export default CompositeAuthProvider;
