import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '../services/groups.service';
import { GroupCreateRequest } from '../types';
import { showToast } from '@/src/lib/toast';
import { authStore } from '@/src/features/auth';

export const useGroups = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: GroupCreateRequest) => {
      const token = authStore.accessToken || '';
      return groupsService.createGroup(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      queryClient.invalidateQueries({ queryKey: ['discoverGroups'] });
      showToast.success('Éxito', 'Grupo creado correctamente');
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'No se pudo crear el grupo'
        : 'No se pudo crear el grupo';
      showToast.error('Error', errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GroupCreateRequest }) => {
      const token = authStore.accessToken || '';
      return groupsService.updateGroup(id, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      queryClient.invalidateQueries({ queryKey: ['discoverGroups'] });
      showToast.success('Éxito', 'Grupo actualizado correctamente');
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'No se pudo actualizar el grupo'
        : 'No se pudo actualizar el grupo';
      showToast.error('Error', errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      const token = authStore.accessToken || '';
      return groupsService.deleteGroup(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
      queryClient.invalidateQueries({ queryKey: ['discoverGroups'] });
      showToast.success('Éxito', 'Grupo eliminado correctamente');
    },
    onError: (error: unknown) => {
      const errorMessage = error && typeof error === 'object' && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'No se pudo eliminar el grupo'
        : 'No se pudo eliminar el grupo';
      showToast.error('Error', errorMessage);
    },
  });

  return {
    createGroup: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateGroup: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteGroup: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};