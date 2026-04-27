import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '../services/groups.service';
import { authStore } from '@/src/features/auth/store/AuthStore';

/**
 * Hook para transferir la propiedad de un grupo a otro miembro
 */
export function useTransferOwnership() {
  const queryClient = useQueryClient();
  const token = authStore.accessToken;

  return useMutation({
    mutationFn: async ({ groupId, newOwnerId }: { groupId: number; newOwnerId: number }) => {
      if (!token) throw new Error('No authentication token');
      return groupsService.transferOwnership(groupId, newOwnerId, token);
    },
    onSuccess: (_data, { groupId }) => {
      // Invalidar todas las queries relacionadas con el grupo
      queryClient.invalidateQueries({
        queryKey: ['group-info', groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['groupDetail', groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['group-members', groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['myGroups'],
      });
      queryClient.invalidateQueries({
        queryKey: ['createdGroups'],
      });
    },
  });
}
