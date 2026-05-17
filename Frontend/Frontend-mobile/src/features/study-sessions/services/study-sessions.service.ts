import { api } from '@/src/constants/api';
import type { StudySessionInstance } from '@uniconnect/shared';

export type AttendanceStatus = 'CONFIRMED' | 'DECLINED' | 'PENDING';

export const studySessionsMobileService = {
  async getSessionsByGroup(groupId: number): Promise<StudySessionInstance[]> {
    const res = await api.get<StudySessionInstance[]>(`/groups/${groupId}/study-sessions`);
    return res.data;
  },

  async updateAttendance(
    groupId: number,
    instanceId: number,
    status: AttendanceStatus,
  ): Promise<void> {
    await api.patch(`/groups/${groupId}/study-sessions/${instanceId}/attendance`, { status });
  },
};
