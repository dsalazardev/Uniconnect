import { useQuery } from '@tanstack/react-query';
import { programsService } from '../services/programs.service';
import { Program } from '../types';

export function usePrograms() {
  return useQuery<Program[], Error>({
    queryKey: ['programs'],
    queryFn: programsService.getAll,
    staleTime: 10 * 60 * 1000, // 10 min — list rarely changes
  });
}
