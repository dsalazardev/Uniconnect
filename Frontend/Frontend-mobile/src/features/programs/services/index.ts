// Service instantiation with mobile Axios instance
import { ProgramsService } from '@uniconnect/shared';
import { api } from '@/src/constants/api';

// Instantiate service with mobile Axios instance
export const programsService = new ProgramsService(api);
