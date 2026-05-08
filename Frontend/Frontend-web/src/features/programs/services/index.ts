import { ProgramsService } from '@uniconnect/shared';
import { api } from '@/constants/api';

export const programsService = new ProgramsService(api);
