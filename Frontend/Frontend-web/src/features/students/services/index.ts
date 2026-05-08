import { StudentsService } from '@uniconnect/shared';
import { api } from '@/constants/api';

export const studentsService = new StudentsService(api);
