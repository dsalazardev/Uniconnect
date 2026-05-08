import { AuthService } from '@uniconnect/shared';
import { api } from '@/constants/api';

export const authService = new AuthService(api);
