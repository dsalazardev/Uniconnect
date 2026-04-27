import { api } from '@/src/constants/api';
import { PROGRAMS_ENDPOINTS } from '../api/endpoints';
import { Program } from '../types';

export const programsService = {
  getAll: async (): Promise<Program[]> => {
    const { data } = await api.get(PROGRAMS_ENDPOINTS.GET_ALL);
    return data;
  },
};
