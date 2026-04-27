/**
 * User Type Definitions
 * 
 * These types define the structure of user data throughout the application.
 * The User interface includes role information for proper authorization checks.
 */

export interface Role {
  id_role: number;
  name: string;
}

export interface User {
  id_user: number;
  email: string;
  full_name: string;
  picture?: string;
  id_role: number;
  id_program?: number;
  google_sub?: string;
  role?: Role; // ⭐ Role object from backend response
  roleName?: string; // ⭐ Role name from JWT payload
  needsOnboarding?: boolean;
}

export interface TokenPayload {
  sub: number;
  permissions: string[];
  roleName?: string; // ⭐ Role name in JWT
  auth0_sub?: string;
  iat?: number;
  exp?: number;
}
