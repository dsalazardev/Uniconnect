/**
 * StudentsService - BFF (Backend for Frontend) layer with Dependency Injection
 * 
 * Handles HTTP communication with the backend API for students.
 * Uses injected Axios instance for platform-agnostic HTTP calls.
 * 
 * Note: This service is platform-agnostic. The common_courses normalization logic
 * that depends on authStore has been removed. Clients should handle this logic
 * in their platform-specific layers if needed.
 */

import type { AxiosInstance } from 'axios';
import type { StudentProfile, Student, UpdateProfileData } from '../types/students';
import { STUDENTS_ENDPOINTS } from '../api/endpoints';

export class StudentsService {
  private readonly api: AxiosInstance;

  /**
   * Constructor with Dependency Injection
   * @param axiosInstance - Configured Axios instance (injected)
   */
  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  /**
   * Get students with optional filters
   */
  async getStudents(filters: { search?: string; id_program?: number; id_course?: number }): Promise<Student[]> {
    const { data } = await this.api.get(STUDENTS_ENDPOINTS.GET_ALL, { params: filters });
    return data;
  }

  /**
   * Get connected community
   */
  async getConnectedCommunity(): Promise<Student[]> {
    const { data } = await this.api.get(STUDENTS_ENDPOINTS.GET_CONNECTED_COMMUNITY);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get not connected community
   */
  async getNotConnectedCommunity(): Promise<Student[]> {
    const { data } = await this.api.get(STUDENTS_ENDPOINTS.GET_NOT_CONNECTED_COMMUNITY);
    return Array.isArray(data) ? data : [];
  }

  /**
   * Get courses
   */
  async getCourses(): Promise<unknown> {
    const { data } = await this.api.get(STUDENTS_ENDPOINTS.GET_COURSES);
    return data;
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<StudentProfile> {
    const response = await this.api.get(STUDENTS_ENDPOINTS.GET_PROFILE);
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<StudentProfile> {
    const response = await this.api.patch(STUDENTS_ENDPOINTS.UPDATE_PROFILE, data);
    return response.data;
  }

  /**
   * Get student profile by ID
   */
  async getStudentProfile(userId: number): Promise<StudentProfile> {
    const response = await this.api.get(`${STUDENTS_ENDPOINTS.GET_STUDENT_PROFILE}/${userId}`);
    return response.data;
  }
}
