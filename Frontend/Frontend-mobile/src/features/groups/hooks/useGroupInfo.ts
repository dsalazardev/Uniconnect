import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '../services';
import { GroupInfo } from '../types';

/**
 * Hook para obtener información detallada del grupo (incluyendo miembros y permisos)
 */
export function useGroupInfo(groupId: number) {
  return useQuery({
    queryKey: ['group-info', groupId],
    queryFn: async () => {
      return groupsService.getGroupInfo(groupId);
    },
    enabled: !!groupId,
    staleTime: 0,
    refetchInterval: 10000, // Refresca cada 10s para detectar pending_owner_id en tiempo real
  });
}

/**
 * Hook para sacar un miembro del grupo (solo owner)
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: number; memberId: number }) => {
      return groupsService.removeMemberFromGroup(groupId, memberId);
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

  return useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: number; memberId: number }) => {
      return groupsService.makeMemberAdmin(groupId, memberId);
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

  return useMutation({
    mutationFn: async (groupId: number) => {
      return groupsService.leaveGroup(groupId);
    },
    onSuccess: (_data, groupId) => {
      queryClient.invalidateQueries({ queryKey: ['group-info', groupId] });
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      queryClient.invalidateQueries({ queryKey: ['discoverGroups'] });
    },
  });
}
