import type { AxiosInstance } from 'axios';
import type { StudySessionInstance, CreateStudySessionDto, AttendanceStatus } from '../types/study-session';
import { STUDY_SESSION_ENDPOINTS } from '../api/endpoints/study-sessions';

export class StudySessionsService {
  constructor(private readonly api: AxiosInstance) {}

  async createSession(groupId: number, payload: CreateStudySessionDto): Promise<StudySessionInstance[]> {
    try {
      const response = await this.api.post(STUDY_SESSION_ENDPOINTS.CREATE_SESSION(groupId), payload);
      return response.data;
    } catch (error) {
      console.error('[StudySessionsService] Error al crear sesión:', error);
      throw error;
    }
  }

  async getSessions(groupId: number): Promise<StudySessionInstance[]> {
    try {
      const response = await this.api.get(STUDY_SESSION_ENDPOINTS.GET_SESSIONS(groupId));
      return response.data;
    } catch (error) {
      console.error('[StudySessionsService] Error al obtener sesiones:', error);
      throw error;
    }
  }

  async cancelInstance(instanceId: number): Promise<void> {
    try {
      await this.api.delete(STUDY_SESSION_ENDPOINTS.DELETE_INSTANCE(instanceId));
    } catch (error) {
      console.error('[StudySessionsService] Error al cancelar instancia:', error);
      throw error;
    }
  }

  async updateAttendance(instanceId: number, status: AttendanceStatus): Promise<void> {
    try {
      await this.api.patch(STUDY_SESSION_ENDPOINTS.UPDATE_ATTENDANCE(instanceId), { status });
    } catch (error) {
      console.error('[StudySessionsService] Error al actualizar asistencia:', error);
      throw error;
    }
  }
}
