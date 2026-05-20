import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionsService } from '../services';
import { showToast } from '@/lib/toast';
import { groupsService } from '@/features/groups/services';
import { authStore } from '@/features/auth/store/AuthStore';

export const useConnections = () => {
  const queryClient = useQueryClient();

  // Obtener solicitudes pendientes — forzar petición fresca siempre
  const { data: pendingRequests, isLoading, isError, refetch } = useQuery({
    queryKey: ['pending-connections'],
    queryFn: async () => {
      const result = await connectionsService.getPendingRequests();
      return result;
    },
    staleTime: 0,
    retry: 3,
    refetchOnMount: 'always',
    gcTime: 0,
  });

  // Obtener conexiones aceptadas
  const { data: myConnections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['my-connections'],
    queryFn: connectionsService.getMyConnections,
    staleTime: 1000 * 60,
  });

  // Abrir chat privado con un usuario
  const openDirectMessage = async (targetUserId: number, navigate?: (path: string) => void): Promise<void> => {
    try {
      const token = authStore.accessToken || '';
      if (!token) {
        showToast.error('Error', 'No estás autenticado');
        return;
      }

      const response = await groupsService.findOrCreateDirectMessage(targetUserId);
      
      if (navigate) {
        navigate('/chat/' + response.group.id_group);
      }
    } catch (error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Error al abrir chat';
      
      if (axiosError.response?.status === 403) {
        showToast.error('Error', 'No tienes una conexión aceptada con este usuario');
      } else if (axiosError.response?.status === 404) {
        showToast.error('Error', 'Usuario no encontrado');
      } else {
        showToast.error('Error', errorMessage);
      }
    }
  };

  // Enviar solicitud de conexión
  const sendRequestMutation = useMutation({
    mutationFn: (data) => connectionsService.sendConnectionRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-connections'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'connected'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'not-connected'] });
      showToast.success('Éxito', 'Solicitud de conexión enviada');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al enviar solicitud';
      showToast.error('Error', message);
    },
  });

  // Aceptar solicitud
  const acceptRequestMutation = useMutation({
    mutationFn: (id) => connectionsService.acceptConnectionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-connections'] });
      queryClient.invalidateQueries({ queryKey: ['connection-status'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'connected'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'not-connected'] });
      showToast.success('Éxito', 'Solicitud aceptada');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al aceptar solicitud';
      showToast.error('Error', message);
    },
  });

  // Rechazar solicitud
  const rejectRequestMutation = useMutation({
    mutationFn: (id) => connectionsService.rejectConnectionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-connections'] });
      queryClient.invalidateQueries({ queryKey: ['connection-status'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'connected'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'not-connected'] });
      showToast.success('Éxito', 'Solicitud rechazada');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al rechazar solicitud';
      showToast.error('Error', message);
    },
  });

  return {
    pendingRequests: pendingRequests || [],
    myConnections,
    isLoading,
    isLoadingConnections,
    isError,
    refetch,
    sendConnectionRequest: sendRequestMutation.mutate,
    acceptConnectionRequest: acceptRequestMutation.mutate,
    rejectConnectionRequest: rejectRequestMutation.mutate,
    isSendingRequest: sendRequestMutation.isPending,
    isAccepting: acceptRequestMutation.isPending,
    isRejecting: rejectRequestMutation.isPending,
    openDirectMessage,
  };
};

// Hook for individual connection status (used in student profile screen)
export const useConnectionStatus = (userId: number) => {
  const queryClient = useQueryClient();

  const { data: connectionStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['connection-status', userId],
    queryFn: () => connectionsService.getConnectionStatus(userId),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });

  const sendRequestMutation = useMutation({
    mutationFn: (data: { addressee_id: number }) => connectionsService.sendConnectionRequest(data),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['connection-status', userId] });
      const prev = queryClient.getQueryData(['connection-status', userId]);
      queryClient.setQueryData(['connection-status', userId], {
        status: 'pending',
        is_requester: true,
        id_connection: null,
      });
      return { prev };
    },
    onError: (error: any, _vars, context: any) => {
      queryClient.setQueryData(['connection-status', userId], context?.prev);
      const message = error.response?.data?.message || 'Error al enviar solicitud';
      showToast.error('Error', message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-status', userId] });
    },
    onSuccess: () => {
      showToast.success('Éxito', 'Solicitud de conexión enviada');
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (id: number) => connectionsService.acceptConnectionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['pending-connections'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'connected'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'not-connected'] });
      showToast.success('Éxito', 'Solicitud aceptada');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al aceptar solicitud';
      showToast.error('Error', message);
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (id: number) => connectionsService.rejectConnectionRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-status', userId] });
      queryClient.invalidateQueries({ queryKey: ['pending-connections'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'connected'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'not-connected'] });
      showToast.success('Éxito', 'Solicitud rechazada');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al rechazar solicitud';
      showToast.error('Error', message);
    },
  });

  return {
    connectionStatus,
    isLoadingStatus,
    sendConnectionRequest: sendRequestMutation.mutate,
    acceptConnectionRequest: acceptRequestMutation.mutate,
    rejectConnectionRequest: rejectRequestMutation.mutate,
    isSendingRequest: sendRequestMutation.isPending,
    isAccepting: acceptRequestMutation.isPending,
    isRejecting: rejectRequestMutation.isPending,
  };
};
