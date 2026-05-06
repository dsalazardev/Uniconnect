// User and authentication types

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
  role?: Role;
  roleName?: string;
  needsOnboarding?: boolean;
  accessToken?: string;
}

export interface TokenPayload {
  sub: number;
  permissions: string[];
  roleName?: string;
  auth0_sub?: string;
  iat?: number;
  exp?: number;
}

export interface UserProfile {
  id_user: number;
  full_name: string;
  email: string;
  picture?: string;
  cell_phone?: string;
  phone?: string;
  id_program?: number;
  current_semester?: number;
  progress?: number;
  program?: {
    id_program: number;
    name: string;
  } | string;
  role?: Role;
  courses?: Array<{
    id_course: number;
    name: string;
    state?: string;
  }>;
}
