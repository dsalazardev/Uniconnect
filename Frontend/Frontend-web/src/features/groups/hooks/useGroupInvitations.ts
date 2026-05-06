import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '../services';
import { GroupInvitation, GroupInvitationRequest } from '../types';

export const useGroupInvitations = (userId: number | undefined) => {
  const queryClient = useQueryClient();

  // Cargar invitaciones pendientes
  const { data: pendingInvitations = [], isLoading: loading, isError, error: queryError, refetch: reloadInvitations } = useQuery({
    queryKey: ['pending-group-invitations', userId],
    queryFn: () => groupsService.getPendingInvitations(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 segundos
  });

  // Cargar invitaciones enviadas
  const { data: sentInvitations = [] } = useQuery({
    queryKey: ['sent-group-invitations', userId],
    queryFn: () => groupsService.getSentInvitations(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30, // 30 segundos
  });

  const error = isError ? (queryError instanceof Error ? queryError.message : 'Error al cargar invitaciones pendientes') : null;

  // Enviar invitación
  const sendInvitationMutation = useMutation({
    mutationFn: (invitationData: GroupInvitationRequest) => groupsService.sendInvitation(invitationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sent-group-invitations', userId] });
      // Invalidar las invitaciones pendientes del destinatario
      queryClient.invalidateQueries({ queryKey: ['pending-group-invitations'] });
    },
  });

  // Responder a invitación
  const respondToInvitationMutation = useMutation({
    mutationFn: ({ invitationId, response }: { invitationId: number; response: 'accepted' | 'rejected' }) =>
      groupsService.respondToInvitation(invitationId, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-group-invitations', userId] });
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      queryClient.invalidateQueries({ queryKey: ['discoverGroups'] });
    },
  });

  // Cancelar invitación
  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: number) => groupsService.cancelInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sent-group-invitations', userId] });
      queryClient.invalidateQueries({ queryKey: ['pending-group-invitations'] });
    },
  });

  return {
    pendingInvitations,
    sentInvitations,
    loading,
    error,
    sendInvitation: sendInvitationMutation.mutate,
    respondToInvitation: (invitationId: number, response: 'accepted' | 'rejected') =>
      respondToInvitationMutation.mutateAsync({ invitationId, response }),
    cancelInvitation: cancelInvitationMutation.mutate,
    reloadInvitations,
  };
};
