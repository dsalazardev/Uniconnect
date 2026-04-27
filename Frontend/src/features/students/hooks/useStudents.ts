import { useQuery } from '@tanstack/react-query';
import { studentService } from '../services/student.service';

export const useStudents = (search?: string) => {
  return useQuery({
    queryKey: ['students', search],
    queryFn: () => studentService.getStudents({ search }),
    staleTime: 0,
  });
};