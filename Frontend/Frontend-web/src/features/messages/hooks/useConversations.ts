import { useState, useEffect, useCallback } from 'react';
import { groupsService } from '@/features/groups/services';
import { waitForAuth } from '@/features/auth/lib/waitForAuth';
import type { Group } from '@uniconnect/shared';

interface UseConversationsResult {
  conversations: Group[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export const useConversations = (userId: number | undefined): UseConversationsResult => {
  const [conversations, setConversations] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      await waitForAuth();
      const groups = await groupsService.getMemberGroups(userId);
      setConversations(groups);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar conversaciones';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return { conversations, loading, error, reload: loadConversations };
};
