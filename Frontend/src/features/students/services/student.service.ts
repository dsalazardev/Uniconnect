import { api } from '@/src/constants/api';
import { STUDENT_ENDPOINTS } from '../api/endpoints';
import { OtherUserProfile, Student, UpdateProfileData, UserProfile } from '../types';
import { authStore } from '../../auth';

const normalizeCommonCourses = (raw: any) => {
  const source =
    raw?.common_courses ??
    raw?.commonCourses ??
    raw?.common_subjects ??
    raw?.commonSubjects ??
    raw?.courses_in_common ??
    raw?.coursesInCommon ??
    [];

  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((course: any, index: number) => {
      if (typeof course === 'string') {
        return {
          id_course: index + 1,
          name: course,
        };
      }

      const fromNested = course?.course;
      const id_course = course?.id_course ?? fromNested?.id_course ?? index + 1;
      const name = course?.name ?? fromNested?.name;

      if (!name) return null;

      return {
        id_course,
        name,
      };
    })
    .filter(Boolean);
};

const calculateCommonCourses = (student: any) => {
  const currentUserEnrollments = authStore.user?.enrollments || authStore.user?.courses || [];
  const studentEnrollments = student?.enrollments || student?.courses || [];

  const currentUserCourseIds = new Set(
    currentUserEnrollments.map((enrollment: any) => {
      const courseId = enrollment?.course?.id_course ?? enrollment?.id_course;
      return courseId;
    })
  );

  const commonCourses = studentEnrollments
    .map((enrollment: any) => {
      const courseId = enrollment?.course?.id_course ?? enrollment?.id_course;
      const courseName = enrollment?.course?.name ?? enrollment?.name;
      
      if (!courseId || !courseName) return null;
      if (!currentUserCourseIds.has(courseId)) return null;

      return {
        id_course: courseId,
        name: courseName,
      };
    })
    .filter(Boolean);

  return commonCourses;
};

const normalizeCommunityStudent = (raw: any): Student => {
  const normalized: any = { ...raw };
  
  const backendCommonCourses = normalizeCommonCourses(raw);

  if (backendCommonCourses.length === 0) {
    const clientCommonCourses = calculateCommonCourses(raw);
    normalized.common_courses = clientCommonCourses;
  } else {
    normalized.common_courses = backendCommonCourses;
  }

  return normalized as Student;
};

export const studentService = {

  getStudents: async (filters: { 
    search?: string; 
    id_program?: number; 
    id_course?: number 
  }): Promise<Student[]> => {
    const { data } = await api.get(STUDENT_ENDPOINTS.GET_ALL, { params: filters });
    return data;
  },

  getConnectedCommunity: async (): Promise<Student[]> => {
    const { data } = await api.get(STUDENT_ENDPOINTS.GET_CONNECTED_COMMUNITY);
    return Array.isArray(data) ? data.map(normalizeCommunityStudent) : [];
  },

  getNotConnectedCommunity: async (): Promise<Student[]> => {
    const { data } = await api.get(STUDENT_ENDPOINTS.GET_NOT_CONNECTED_COMMUNITY);
    return Array.isArray(data) ? data.map(normalizeCommunityStudent) : [];
  },

  getCourses: async () => {
    const { data } = await api.get(STUDENT_ENDPOINTS.GET_COURSES);
    return data;
  },

  getProfile: async (token: string): Promise<UserProfile> => {
    const response = await api.get(`${STUDENT_ENDPOINTS.GET_PROFILE}`);
    return response.data;
  },

   updateProfile: async (data: UpdateProfileData, token: string): Promise<UserProfile> => {
    const response = await api.patch(`${STUDENT_ENDPOINTS.UPDATE_PROFILE}`, data);
    return response.data;
  },

  getStudentProfile: async (userId: number): Promise<OtherUserProfile> => {
    const response = await api.get(`${STUDENT_ENDPOINTS.GET_STUDENT_PROFILE}/${userId}`);
    return response.data;
  }


};