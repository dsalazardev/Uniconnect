import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionsService } from '../services';
import { showToast } from '@/src/lib/toast';
import { groupsService } from '@/src/features/groups/services';
import { authStore } from '@/src/features/auth';
import { useRouter } from 'expo-router';

export const useConnections = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Obtener solicitudes pendientes — sin polling, se refresca tras cada acción
  const { data: pendingRequests, isLoading, isError, refetch } = useQuery({
    queryKey: ['pending-connections'],
    queryFn: () => connectionsService.getPendingRequests(),
    staleTime: 1000 * 60, // 1 minuto — no refetch automático
  });

  // Obtener conexiones aceptadas (deshabilitado por ahora - endpoint no implementado)
  const myConnections: any[] = [];
  // const { data: myConnections = [] } = useQuery({
  //   queryKey: ['my-connections'],
  //   queryFn: connectionService.getMyConnections,
  //   staleTime: 1000 * 60, // 1 minuto — no refetch automático
  // });

  // Abrir chat privado con un usuario
  const openDirectMessage = async (targetUserId: number): Promise<void> => {
    try {
      const token = authStore.accessToken || '';
      if (!token) {
        showToast.error('Error', 'No estás autenticado');
        return;
      }

      const response = await groupsService.findOrCreateDirectMessage(targetUserId);
      
      // Navegar al chat con el grupo retornado
      router.push(`/groups/${response.group.id_group}`);
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
    staleTime: 1000 * 60, // 1 minuto — no refetch automático
  });

  const sendRequestMutation = useMutation({
    mutationFn: (data) => connectionsService.sendConnectionRequest(data),
    onMutate: async () => {
      // Actualización optimista: muestra "Solicitud pendiente" al instante
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
      // Revierte si falla
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
    mutationFn: (id) => connectionsService.acceptConnectionRequest(id),
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
    mutationFn: (id) => connectionsService.rejectConnectionRequest(id),
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