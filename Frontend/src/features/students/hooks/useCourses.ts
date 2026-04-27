import { useQuery } from '@tanstack/react-query';
import { studentService } from '../services/student.service';

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => studentService.getCourses(),
    staleTime: 1000 * 60 * 30,
  });
};