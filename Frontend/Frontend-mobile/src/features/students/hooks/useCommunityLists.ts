import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { studentsService } from '../services';
import { authStore } from '@/src/features/auth';
import { Student } from '../types';

const filterStudentsBySearch = (students: Student[], search: string): Student[] => {
  const normalized = search.trim().toLowerCase();

  if (!normalized) return students;

  return students.filter((student) => {
    const fullName = student.full_name?.toLowerCase() || '';
    const programName = student.program?.name?.toLowerCase() || '';
    const commonCourses = (student.common_courses || [])
      .map((course) => course.name.toLowerCase())
      .join(' ');

    return (
      fullName.includes(normalized) ||
      programName.includes(normalized) ||
      commonCourses.includes(normalized)
    );
  });
};

export const useCommunityLists = (search: string) => {
  const currentUserId = authStore.user?.id_user;

  const connectedQuery = useQuery({
    queryKey: ['community', 'connected'],
    queryFn: async () => {
      const data = await studentsService.getConnectedCommunity();
      return data.filter((student) => student.id_user !== currentUserId);
    },
    staleTime: 1000 * 60,
  });

  const notConnectedQuery = useQuery({
    queryKey: ['community', 'not-connected'],
    queryFn: async () => {
      const data = await studentsService.getNotConnectedCommunity();
      return data.filter((student) => student.id_user !== currentUserId);
    },
    staleTime: 1000 * 60,
  });

  const connectedStudents = useMemo(
    () => filterStudentsBySearch(connectedQuery.data || [], search),
    [connectedQuery.data, search]
  );

  const notConnectedStudents = useMemo(
    () => filterStudentsBySearch(notConnectedQuery.data || [], search),
    [notConnectedQuery.data, search]
  );

  return {
    connectedStudents,
    notConnectedStudents,
    connectedQuery,
    notConnectedQuery,
  };
};
