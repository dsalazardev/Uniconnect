import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '../services/groups.service';
import { authStore } from '@/src/features/auth/store/AuthStore';
import { JoinRequestResponse, GroupJoinRequest } from '../types';

/**
 * Hook para solicitar acceso a un grupo
 */
export function useJoinRequest() {
  const queryClient = useQueryClient();
  const token = authStore.accessToken;

  return useMutation({
    mutationFn: async (groupId: number) => {
      if (!token) throw new Error('No authentication token');
      return groupsService.requestJoinGroup(groupId, token);
    },
    onSuccess: (_data, groupId) => {
      // Invalidar queries relacionadas al grupo
      queryClient.invalidateQueries({
        queryKey: ['groupDetail', groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['discoverGroups'],
      });
    },
  });
}

/**
 * Hook para obtener el estado de una solicitud de acceso
 */
export function useCheckJoinRequestStatus(groupId: number) {
  const queryClient = useQueryClient();
  const token = authStore.accessToken;

  return useQuery({
    queryKey: ['join-request-status', groupId],
    queryFn: async () => {
      if (!token) return null;
      // Obtener información del grupo para ver si el usuario ya solicitó
      const groupInfo = await groupsService.getGroupInfo(groupId, token);
      return groupInfo;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
