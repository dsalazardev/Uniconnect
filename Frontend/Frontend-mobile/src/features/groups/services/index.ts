// Service instantiation with mobile Axios instance
import { GroupsService } from '@uniconnect/shared';
import { api } from '@/src/constants/api';

// Instantiate service with mobile Axios instance
export const groupsService = new GroupsService(api);
