import { useQuery } from '@tanstack/react-query';
import { studentsService } from '../services';

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: () => studentsService.getCourses(),
    staleTime: 1000 * 60 * 30,
  });
};