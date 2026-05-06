// Service instantiation with mobile Axios instance
import { AuthService } from '@uniconnect/shared';
import { api } from '@/src/constants/api';

// Instantiate service with mobile Axios instance
export const authService = new AuthService(api);
