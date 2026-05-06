import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '../services/groups.service';
import { authStore } from '@/src/features/auth/store/AuthStore';
import { GroupInfo } from '../types';

/**
 * Hook para obtener información detallada del grupo (incluyendo miembros y permisos)
 */
export function useGroupInfo(groupId: number) {
  const token = authStore.accessToken;

  return useQuery({
    queryKey: ['group-info', groupId],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      return groupsService.getGroupInfo(groupId, token);
    },
    enabled: !!token && !!groupId,
    staleTime: 0,
    refetchInterval: 10000, // Refresca cada 10s para detectar pending_owner_id en tiempo real
  });
}

/**
 * Hook para sacar un miembro del grupo (solo owner)
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();
  const token = authStore.accessToken;

  return useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: number; memberId: number }) => {
      if (!token) throw new Error('No authentication token');
      return groupsService.removeMemberFromGroup(groupId, memberId, token);
    },
    onSuccess: (_data, { groupId }) => {
      // Invalidar info del grupo
      queryClient.invalidateQueries({
        queryKey: ['group-info', groupId],
      });
    },
  });
}

/**
 * Hook para promocionar a admin a un miembro (solo owner)
 */
export function useMakeMemberAdmin() {
  const queryClient = useQueryClient();
  const token = authStore.accessToken;

  return useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: number; memberId: number }) => {
      if (!token) throw new Error('No authentication token');
      return groupsService.makeMemberAdmin(groupId, memberId, token);
    },
    onSuccess: (_data, { groupId }) => {
      // Invalidar info del grupo
      queryClient.invalidateQueries({
        queryKey: ['group-info', groupId],
      });
    },
  });
}

/**
 * Hook para abandonar un grupo
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const token = authStore.accessToken;

  return useMutation({
    mutationFn: async (groupId: number) => {
      if (!token) throw new Error('No authentication token');
      return groupsService.leaveGroup(groupId, token);
    },
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-info', groupId] });
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      queryClient.invalidateQueries({ queryKey: ['discoverGroups'] });
    },
  });
}
