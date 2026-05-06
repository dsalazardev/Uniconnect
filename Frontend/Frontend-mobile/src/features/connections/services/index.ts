// Service instantiation with mobile Axios instance
import { ConnectionsService } from '@uniconnect/shared';
import { api } from '@/src/constants/api';

// Instantiate service with mobile Axios instance
export const connectionsService = new ConnectionsService(api);
