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
    staleTime: 3 * 60 * 1000, // 3 minutos
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
      // Invalidar varios queries relacionados
      queryClient.invalidateQueries({
        queryKey: ['group-info', groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['member-groups'],
      });
      queryClient.invalidateQueries({
        queryKey: ['discover-groups'],
      });
    },
  });
}
