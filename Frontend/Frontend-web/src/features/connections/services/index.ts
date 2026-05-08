import { ConnectionsService } from '@uniconnect/shared';
import { api } from '@/constants/api';

export const connectionsService = new ConnectionsService(api);
