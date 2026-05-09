/**
 * CoursesService - BFF (Backend for Frontend) layer with Dependency Injection
 * 
 * Handles HTTP communication with the backend API for courses.
 * Uses injected Axios instance for platform-agnostic HTTP calls.
 */

import type { AxiosInstance } from 'axios';
import { COURSES_ENDPOINTS } from '../api/endpoints';

export class CoursesService {
  private readonly api: AxiosInstance;

  /**
   * Constructor with Dependency Injection
   * @param axiosInstance - Configured Axios instance (injected)
   */
  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  /**
   * Get courses by student
   */
  async getByStudent(): Promise<unknown> {
    const { data } = await this.api.get(COURSES_ENDPOINTS.GET_PROGRAM_COURSES);
    return data;
  }

  /**
   * Get own active courses
   */
  async getOwnActiveCourses(): Promise<unknown> {
    const { data } = await this.api.get(COURSES_ENDPOINTS.GET_OWNER_ACTIVE_COURSES);
    return data;
  }

  /**
   * Get all courses enrolled by the current student
   */
  async getOwnCourses(): Promise<unknown> {
    const { data } = await this.api.get(COURSES_ENDPOINTS.GET_OWNER_ACTIVE_COURSES);
    return data;
  }

  /**
   * Add course to student
   */
  async addCourseToStudent(data: { id_course: string; status: string }): Promise<unknown> {
    const response = await this.api.post(COURSES_ENDPOINTS.ADD_COURSE_TO_STUDENT, {
      id_course: parseInt(data.id_course, 10),
      status: data.status,
    });
    return response.data;
  }

  /**
   * Delete course from student
   */
  async deleteCourseFromStudent(id_course: number): Promise<unknown> {
    const response = await this.api.delete(`${COURSES_ENDPOINTS.DELETE_COURSE_FROM_STUDENT}/${id_course}`);
    return response.data;
  }

  /**
   * Update course state
   */
  async updateCourseState(courseId: number, state: string): Promise<unknown> {
    const response = await this.api.patch(`${COURSES_ENDPOINTS.UPDATE_COURSE_STATE}/${courseId}`, {
      state,
    });
    return response.data;
  }
}
