import { useQuery } from '@tanstack/react-query';
import { studentsService } from '../services';

export const useStudentProfile = (userId: number) => {
  return useQuery({
    queryKey: ['student-profile', userId],
    queryFn: () => studentsService.getStudentProfile(userId),
    enabled: !!userId,
  });
};