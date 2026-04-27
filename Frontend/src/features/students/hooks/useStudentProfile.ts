import { useQuery } from '@tanstack/react-query';
import { studentService } from '../services/student.service';

export const useStudentProfile = (userId: number) => {
  return useQuery({
    queryKey: ['student-profile', userId],
    queryFn: () => studentService.getStudentProfile(userId),
    enabled: !!userId,
  });
};