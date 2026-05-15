import { useState, useEffect, useCallback } from 'react';
import { studySessionsService } from '../services/study-sessions.service';
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
      // Optimistic update
      setSessions((prev) =>
        prev.map((s) =>
          s.id_instance === instanceId ? { ...s, status: 'CANCELLED' as const } : s,
        ),
      );
      try {
        await studySessionsService.cancelInstance(groupId, instanceId);
        // Remove cancelled instance from list after successful API call
        setSessions((prev) => prev.filter((s) => s.id_instance !== instanceId));
      } catch (err) {
        // Revert on failure
        await loadSessions();
        throw err;
      }
    },
    [groupId, loadSessions],
  );

  return { sessions, loading, error, createSession, cancelInstance, reload: loadSessions };
};
