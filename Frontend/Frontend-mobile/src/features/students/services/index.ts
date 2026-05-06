// Service instantiation with mobile Axios instance
import { StudentsService } from '@uniconnect/shared';
import { api } from '@/src/constants/api';

// Instantiate service with mobile Axios instance
export const studentsService = new StudentsService(api);
