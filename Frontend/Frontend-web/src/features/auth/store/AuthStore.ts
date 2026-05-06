import { makeAutoObservable } from 'mobx';
import type { User } from '@uniconnect/shared';

// ============================================================================
// Web Storage Utility - localStorage (persistent across sessions)
// ============================================================================
const webStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage.getItem failed:', error);
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('localStorage.setItem failed:', error);
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage.removeItem failed:', error);
    }
  },
};

export class AuthStore {
  accessToken: string | null = null;
  user: User | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  needsOnboarding: boolean = false;
  
  auth0Tokens: {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    expires_in?: number;
    expires_at?: number;
  } | null = null;

  isInitialized: boolean = false;
  isRefreshing: boolean = false;

  constructor() {
    makeAutoObservable(this);
    this.initializeFromStorage();
  }

  get isAuthenticated() {
    return !!this.accessToken;
  }

  get isTokenExpired() {
    if (!this.auth0Tokens?.expires_at) return false;
    return Date.now() >= this.auth0Tokens.expires_at;
  }

  get hasRefreshToken() {
    return !!this.auth0Tokens?.refresh_token;
  }

  setAuth(token: string, userData: User, auth0TokensData?: any) {
    this.accessToken = token;
    
    this.user = {
      ...userData,
      role: userData.role,
      roleName: userData.roleName,
    };
    
    this.error = null;
    this.needsOnboarding = userData?.needsOnboarding ?? false;
    
    if (auth0TokensData) {
      const expiresIn = auth0TokensData.expires_in || 86400;
      const validExpiresIn = Math.max(60, Math.min(expiresIn, 30 * 24 * 60 * 60));
      
      this.auth0Tokens = {
        ...auth0TokensData,
        expires_in: validExpiresIn,
        expires_at: Date.now() + (validExpiresIn * 1000)
      };
      
      if (!auth0TokensData.refresh_token) {
        console.warn('WARNING: No refresh_token received from backend!');
      }
    } else {
      console.warn('WARNING: No auth0TokensData provided to setAuth!');
    }

    this.persistToStorage();
  }

  setLoading(status: boolean) {
    this.isLoading = status;
  }

  setError(errorMessage: string) {
    this.error = errorMessage;
    this.isLoading = false;
  }

  clearError() {
    this.error = null;
  }

  clearAuth() {
    this.accessToken = null;
    this.user = null;
    this.error = null;
    this.auth0Tokens = null;
    this.needsOnboarding = false;
    this.isRefreshing = false;
    
    this.clearFromStorage();
  }

  updateUser(userData: User) {
    this.user = {
      ...userData,
      role: userData.role,
      roleName: userData.roleName,
    };
    this.persistToStorage();
  }

  setNeedsOnboarding(value: boolean) {
    this.needsOnboarding = value;
    this.persistToStorage();
  }

  private initializeFromStorage() {
    try {
      const storedAuth = webStorage.getItem('uniconnect-auth');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        
        if (authData.user && authData.user.id_role && !authData.user.role && !authData.user.roleName) {
          console.warn('Legacy cached data detected without role structure - clearing auth');
          this.clearFromStorage();
          this.isInitialized = true;
          return;
        }
        
        this.accessToken = authData.accessToken;
        this.user = authData.user;
        this.auth0Tokens = authData.auth0Tokens;
        this.needsOnboarding = authData.needsOnboarding ?? false;
      }
    } catch (error) {
      console.error('Failed to restore auth state from storage:', error);
    } finally {
      this.isInitialized = true;
    }
  }

  private persistToStorage() {
    try {
      const authData = {
        accessToken: this.accessToken,
        user: this.user,
        auth0Tokens: this.auth0Tokens,
        needsOnboarding: this.needsOnboarding,
      };
      
      webStorage.setItem('uniconnect-auth', JSON.stringify(authData));
    } catch (error) {
      console.error('Failed to persist auth state to storage:', error);
    }
  }

  private clearFromStorage() {
    try {
      webStorage.removeItem('uniconnect-auth');
    } catch (error) {
      console.error('Failed to clear auth state from storage:', error);
    }
  }
}

export const authStore = new AuthStore();
