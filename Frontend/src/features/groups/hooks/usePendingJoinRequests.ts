import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '../services/groups.service';
import { authStore } from '@/src/features/auth/store/AuthStore';
import { GroupJoinRequest, GroupWithJoinRequests } from '../types';

/**
 * Hook para obtener solicitudes pendientes de un grupo específico (para el owner)
 */
export function useGroupJoinRequests(groupId: number) {
  const token = authStore.accessToken;

  return useQuery({
    queryKey: ['group-join-requests', groupId],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      return groupsService.getGroupJoinRequests(groupId, token);
    },
    enabled: !!token && !!groupId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para obtener solicitudes pendientes de acceso a grupos del owner
 */
export function usePendingJoinRequests() {
  const token = authStore.accessToken;

  return useQuery({
    queryKey: ['pending-join-requests'],
    queryFn: async () => {
      if (!token) throw new Error('No authentication token');
      return groupsService.getPendingJoinRequests(token);
    },
    enabled: !!token,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para aceptar una solicitud de acceso a un grupo
 */
export function useAcceptJoinRequest() {
  const queryClient = useQueryClient();
  const token = authStore.accessToken;

  return useMutation({
    mutationFn: async ({ groupId, requestId }: { groupId: number; requestId: number }) => {
      if (!token) throw new Error('No authentication token');
      return groupsService.acceptJoinRequest(groupId, requestId, token);
    },
    onSuccess: (data, { groupId }) => {
      // Invalidar las solicitudes pendientes
      queryClient.invalidateQueries({
        queryKey: ['pending-join-requests'],
      });
      // Invalidar solicitudes del grupo específico
      queryClient.invalidateQueries({
        queryKey: ['group-join-requests', groupId],
      });
      // Invalidar info del grupo
      queryClient.invalidateQueries({
        queryKey: ['group-info', groupId],
      });
      // Invalidar miembros del grupo
      queryClient.invalidateQueries({
        queryKey: ['group-members', groupId],
      });
      // Invalidar "Mis Grupos" para que aparezca el nuevo miembro
      queryClient.invalidateQueries({
        queryKey: ['myGroups'],
      });
    },
  });
}

/**
 * Hook para rechazar una solicitud de acceso a un grupo
 */
export function useRejectJoinRequest() {
  const queryClient = useQueryClient();
  const token = authStore.accessToken;

  return useMutation({
    mutationFn: async ({ groupId, requestId }: { groupId: number; requestId: number }) => {
      if (!token) throw new Error('No authentication token');
      return groupsService.rejectJoinRequest(groupId, requestId, token);
    },
    onSuccess: (_data, { groupId }) => {
      // Invalidar las solicitudes pendientes
      queryClient.invalidateQueries({
        queryKey: ['pending-join-requests'],
      });
      // Invalidar info del grupo
      queryClient.invalidateQueries({
        queryKey: ['group-info', groupId],
      });
    },
  });
}
