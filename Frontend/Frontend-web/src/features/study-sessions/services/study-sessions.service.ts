import { api } from '@/constants/api';
import type { StudySessionInstance, CreateStudySessionDto } from '@uniconnect/shared';

export type AttendanceStatus = 'CONFIRMED' | 'DECLINED' | 'PENDING';

export const studySessionsService = {
  async getSessionsByGroup(groupId: number): Promise<StudySessionInstance[]> {
    const res = await api.get<StudySessionInstance[]>(`/groups/${groupId}/study-sessions`);
    return res.data;
  },

  async createSession(
    groupId: number,
    dto: CreateStudySessionDto,
  ): Promise<StudySessionInstance[]> {
    const res = await api.post<StudySessionInstance[]>(
      `/groups/${groupId}/study-sessions`,
      dto,
    );
    return res.data;
  },

  async cancelInstance(groupId: number, instanceId: number): Promise<void> {
    await api.delete(`/groups/${groupId}/study-sessions/${instanceId}`);
  },

  async updateAttendance(
    groupId: number,
    instanceId: number,
    status: AttendanceStatus,
  ): Promise<void> {
    await api.patch(`/groups/${groupId}/study-sessions/${instanceId}/attendance`, { status });
  },
};
