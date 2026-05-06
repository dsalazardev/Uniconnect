import { makeAutoObservable } from 'mobx';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types/user.types';

// ============================================================================
// Secure Storage Utility - Platform-aware persistence
// Web:    sessionStorage (cleared on tab close, mitigates XSS persistence)
// Mobile: expo-secure-store (AES-256 via Keychain/Keystore)
// ============================================================================
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return sessionStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      sessionStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      sessionStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export class AuthStore {
  accessToken: string | null = null;
  user: User | null = null; // ⭐ FIX: Properly typed User interface
  isLoading: boolean = false;
  error: string | null = null;
  needsOnboarding: boolean = false;
  
  auth0Tokens: {
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
    expires_in?: number;
    expires_at?: number; // Calculated expiration timestamp
  } | null = null;

  isInitialized: boolean = false;
  isRefreshing: boolean = false; // Guard against simultaneous refresh attempts

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
    
    // ⭐ FIX: Properly extract and store role data
    // Ensure role object and roleName are preserved
    this.user = {
      ...userData,
      role: userData.role, // Role object from backend response
      roleName: userData.roleName, // Role name from JWT or backend
    };
    
    this.error = null;
    this.needsOnboarding = userData?.needsOnboarding ?? false;
    
    // Store Auth0 tokens with expiration calculation
    if (auth0TokensData) {
      // Ensure expires_in has a reasonable default (24 hours = 86400 seconds)
      const expiresIn = auth0TokensData.expires_in || 86400;
      
      // Validate that expires_in is a reasonable duration (at least 60 seconds, at most 30 days)
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

    // Persist to storage
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
    this.isRefreshing = false; // Reset refresh guard
    
    // Clear from storage
    this.clearFromStorage();
  }

  /**
   * Update user profile data (for profile updates)
   */
  updateUser(userData: User) {
    // ⭐ FIX: Preserve role data when updating user
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

  private async initializeFromStorage() {
    try {
      const storedAuth = await secureStorage.getItem('uniconnect-auth');
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        
        // ⭐ FIX: Detect and clean legacy cached data without role structure
        if (authData.user && authData.user.id_role && !authData.user.role && !authData.user.roleName) {
          console.warn('Legacy cached data detected without role structure - clearing auth');
          await this.clearFromStorage();
          this.isInitialized = true;
          return;
        }
        
        // Restore auth state
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

  private async persistToStorage() {
    try {
      const authData = {
        accessToken: this.accessToken,
        user: this.user,
        auth0Tokens: this.auth0Tokens,
        needsOnboarding: this.needsOnboarding,
      };
      
      await secureStorage.setItem('uniconnect-auth', JSON.stringify(authData));
      
    } catch (error) {
      console.error('Failed to persist auth state to storage:', error);
    }
  }

  private async clearFromStorage() {
    try {
      await secureStorage.removeItem('uniconnect-auth');
      
    } catch (error) {
      console.error('Failed to clear auth state from storage:', error);
    }
  }
}

// Instancia Singleton para inyección simple (Kiro Pattern Base)
export const authStore = new AuthStore();