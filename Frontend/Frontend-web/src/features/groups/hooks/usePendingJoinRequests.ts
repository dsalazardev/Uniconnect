import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '../services';
import { GroupJoinRequest } from '../types';

/**
 * Hook para obtener solicitudes pendientes de un grupo específico (para el owner)
 */
export function useGroupJoinRequests(groupId: number) {
  return useQuery({
    queryKey: ['group-join-requests', groupId],
    queryFn: async () => {
      return groupsService.getGroupJoinRequests(groupId);
    },
    enabled: !!groupId,
    staleTime: 0, // Siempre fresco — las acciones de aceptar/rechazar deben verse al instante
  });
}

/**
 * Hook para obtener solicitudes pendientes de acceso a grupos del owner
 */
export function usePendingJoinRequests() {
  return useQuery({
    queryKey: ['pending-join-requests'],
    queryFn: async () => {
      return groupsService.getPendingJoinRequests();
    },
    staleTime: 0,
  });
}

/**
 * Hook para aceptar una solicitud — actualización optimista inmediata
 */
export function useAcceptJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, requestId }: { groupId: number; requestId: number }) => {
      return groupsService.acceptJoinRequest(groupId, requestId);
    },
    onMutate: async ({ groupId, requestId }) => {
      // Cancelar refetches en vuelo para evitar sobreescribir el optimistic update
      await queryClient.cancelQueries({ queryKey: ['group-join-requests', groupId] });

      // Snapshot para rollback
      const previous = queryClient.getQueryData<GroupJoinRequest[]>(['group-join-requests', groupId]);

      // Quitar la solicitud del cache inmediatamente
      queryClient.setQueryData<GroupJoinRequest[]>(
        ['group-join-requests', groupId],
        (old) => (old ?? []).filter((r) => r.id_request !== requestId),
      );

      return { previous, groupId };
    },
    onError: (_err, _vars, context) => {
      // Rollback si falla
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['group-join-requests', context.groupId], context.previous);
      }
    },
    onSettled: (_data, _err, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-join-requests', groupId] });
      queryClient.invalidateQueries({ queryKey: ['pending-join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['group-info', groupId] });
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
    },
  });
}

/**
 * Hook para rechazar una solicitud — actualización optimista inmediata
 */
export function useRejectJoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupId, requestId }: { groupId: number; requestId: number }) => {
      return groupsService.rejectJoinRequest(groupId, requestId);
    },
    onMutate: async ({ groupId, requestId }) => {
      await queryClient.cancelQueries({ queryKey: ['group-join-requests', groupId] });

      const previous = queryClient.getQueryData<GroupJoinRequest[]>(['group-join-requests', groupId]);

      // Quitar la solicitud del cache inmediatamente
      queryClient.setQueryData<GroupJoinRequest[]>(
        ['group-join-requests', groupId],
        (old) => (old ?? []).filter((r) => r.id_request !== requestId),
      );

      return { previous, groupId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['group-join-requests', context.groupId], context.previous);
      }
    },
    onSettled: (_data, _err, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['group-join-requests', groupId] });
      queryClient.invalidateQueries({ queryKey: ['pending-join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['group-info', groupId] });
    },
  });
}
