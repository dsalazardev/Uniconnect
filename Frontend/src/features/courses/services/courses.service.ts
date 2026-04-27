import { api } from '@/src/constants/api';
import { COURSES_ENDPOINTS } from '../api/endpoints';

export const courseService = {
  getByStudent: async () => {
    const { data } = await api.get(COURSES_ENDPOINTS.GET_PROGRAM_COURSES);
    return data;
  },

  getOwnActiveCourses: async () => {
    const { data } = await api.get(COURSES_ENDPOINTS.GET_OWNER_ACTIVE_COURSES);
    return data;
  },

  addCourseToStudent: async (data: { id_course: string; status: string }) => {
    const response = await api.post(COURSES_ENDPOINTS.ADD_COURSE_TO_STUDENT, 
      {
        id_course: parseInt(data.id_course, 10),
        status: data.status,
      });
    return response.data;
  },

  deleteCourseFromStudent: async (id_course: number) => {
    const response = await api.delete(`${COURSES_ENDPOINTS.DELETE_COURSE_FROM_STUDENT}/${id_course}`);
    return response.data;
  },

  updateCourseState: async (courseId: number, state: string) => {
    const response = await api.patch(`${COURSES_ENDPOINTS.UPDATE_COURSE_STATE}/${courseId}`, {
      state,
    });
    return response.data;
  },

};