import { auth, signOut } from './auth.js';

export class CommonUtils {
  static getToken() {
    return localStorage.getItem('token');
  }

  static setToken(token) {
    localStorage.setItem('token', token);
  }

  static removeToken() {
    localStorage.removeItem('token');
  }

  static async checkAuth() {
    try {
      const user = auth.currentUser;
      if (!user) return { isAuthenticated: false, isAdmin: false };
      
      const idToken = await user.getIdTokenResult(true);
      return {
        isAuthenticated: true,
        isAdmin: idToken.claims.admin || false,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0]
        }
      };
    } catch (error) {
      console.error('Auth check failed:', error);
      return { isAuthenticated: false, isAdmin: false };
    }
  }

  static async logout() {
    try {
      await signOut(auth);
      this.removeToken();
      window.location.href = '/login.html';
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  static async updateHeader() {
    const { isAuthenticated, isAdmin, user } = await this.checkAuth();
    
    const loginLink = document.getElementById('loginDropdownLink');
    const logoutLink = document.getElementById('logoutDropdownLink');
    const adminDivider = document.getElementById('adminDivider');
    const adminLink = document.getElementById('adminDashboardDropdownLink');

    if (loginLink) loginLink.style.display = isAuthenticated ? 'none' : 'block';
    if (logoutLink) logoutLink.style.display = isAuthenticated ? 'block' : 'none';
    if (adminDivider) adminDivider.style.display = isAdmin ? 'block' : 'none';
    if (adminLink) adminLink.style.display = isAdmin ? 'block' : 'none';

    if (logoutLink) {
      logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        await this.logout();
      });
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => CommonUtils.updateHeader());