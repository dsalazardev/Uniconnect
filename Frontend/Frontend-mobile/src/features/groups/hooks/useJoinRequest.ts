import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '../services';
import { JoinRequestResponse, GroupJoinRequest } from '../types';

/**
 * Hook para solicitar acceso a un grupo
 */
export function useJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: number) => {
      return groupsService.requestJoinGroup(groupId);
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

  return useQuery({
    queryKey: ['join-request-status', groupId],
    queryFn: async () => {
      // Obtener información del grupo para ver si el usuario ya solicitó
      const groupInfo = await groupsService.getGroupInfo(groupId);
      return groupInfo;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
