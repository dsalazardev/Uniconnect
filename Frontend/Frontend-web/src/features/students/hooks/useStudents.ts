import { useQuery } from '@tanstack/react-query';
import { studentsService } from '../services';

export const useStudents = (search?: string) => {
  return useQuery({
    queryKey: ['students', search],
    queryFn: () => studentsService.getStudents({ search }),
    staleTime: 0,
  });
};