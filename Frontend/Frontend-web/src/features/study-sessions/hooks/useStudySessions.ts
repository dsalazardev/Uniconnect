import { useState, useEffect, useCallback } from 'react';
import { studySessionsService, type AttendanceStatus } from '../services/study-sessions.service';
import { websocketService } from '@/features/messages/services/websocket.service';
import type { StudySessionInstance, CreateStudySessionDto } from '@uniconnect/shared';

export const useStudySessions = (groupId: number) => {
  const [sessions, setSessions] = useState<StudySessionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await studySessionsService.getSessionsByGroup(groupId);
      setSessions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error al cargar sesiones de estudio');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Recarga en tiempo real cuando otro miembro crea una sesión en este grupo
  useEffect(() => {
    const handler = (payload: { tipo_evento: string; entidad_relacionada_id?: number }) => {
      if (
        payload.tipo_evento === 'study_session_created' &&
        payload.entidad_relacionada_id === groupId
      ) {
        loadSessions();
      }
    };
    websocketService.on('notification:new', handler);
    return () => websocketService.off('notification:new', handler);
  }, [groupId, loadSessions]);

  const createSession = useCallback(
    async (dto: CreateStudySessionDto) => {
      const newInstances = await studySessionsService.createSession(groupId, dto);
      setSessions((prev) => {
        const merged = [...prev, ...newInstances];
        return merged.sort(
          (a, b) =>
            new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime(),
        );
      });
    },
    [groupId],
  );

  const cancelInstance = useCallback(
    async (instanceId: number) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id_instance === instanceId ? { ...s, status: 'CANCELLED' as const } : s,
        ),
      );
      try {
        await studySessionsService.cancelInstance(groupId, instanceId);
        setSessions((prev) => prev.filter((s) => s.id_instance !== instanceId));
      } catch (err) {
        await loadSessions();
        throw err;
      }
    },
    [groupId, loadSessions],
  );

  const updateAttendance = useCallback(
    async (instanceId: number, status: AttendanceStatus) => {
      await studySessionsService.updateAttendance(groupId, instanceId, status);
      setSessions((prev) =>
        prev.map((s) =>
          s.id_instance === instanceId ? { ...s, my_attendance: status } : s,
        ),
      );
    },
    [groupId],
  );

  return { sessions, loading, error, createSession, cancelInstance, updateAttendance, reload: loadSessions };
};
