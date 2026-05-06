// Service instantiation with mobile Axios instance
import { CoursesService } from '@uniconnect/shared';
import { api } from '@/src/constants/api';

// Instantiate service with mobile Axios instance
export const coursesService = new CoursesService(api);
