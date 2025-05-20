// This file assumes 'auth.js' exports the 'auth' object
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
          displayName: user.displayName
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
    
    const elements = {
      userInfo: document.getElementById('userInfoSpan'),
      logoutBtn: document.getElementById('logoutButton'),
      adminLink: document.getElementById('adminDashboardLink')
    };

    if (elements.userInfo) {
      elements.userInfo.textContent = isAuthenticated ? `Hi, ${user?.displayName || 'User'}!` : '';
      elements.userInfo.style.display = isAuthenticated ? 'inline' : 'none';
    }

    if (elements.logoutBtn) {
      elements.logoutBtn.style.display = isAuthenticated ? 'block' : 'none';
      elements.logoutBtn.onclick = this.logout.bind(this);
    }

    if (elements.adminLink) {
      elements.adminLink.style.display = isAdmin ? 'block' : 'none';
    }
  }
}

// Initialize header on page load
document.addEventListener('DOMContentLoaded', () => CommonUtils.updateHeader());