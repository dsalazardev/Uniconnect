import { CoursesService } from '@uniconnect/shared';
import { api } from '@/constants/api';

export const coursesService = new CoursesService(api);
