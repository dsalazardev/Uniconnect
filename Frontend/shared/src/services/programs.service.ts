/**
 * ProgramsService - BFF (Backend for Frontend) layer with Dependency Injection
 * 
 * Handles HTTP communication with the backend API for programs.
 * Uses injected Axios instance for platform-agnostic HTTP calls.
 */

import type { AxiosInstance } from 'axios';
import type { Program } from '../types/programs';
import { PROGRAMS_ENDPOINTS } from '../api/endpoints';

export class ProgramsService {
  private readonly api: AxiosInstance;

  /**
   * Constructor with Dependency Injection
   * @param axiosInstance - Configured Axios instance (injected)
   */
  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  /**
   * Get all programs
   */
  async getAll(): Promise<Program[]> {
    const { data } = await this.api.get(PROGRAMS_ENDPOINTS.GET_ALL);
    return data;
  }
}
