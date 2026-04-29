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
      console.error('[useGroups] createGroup error:', error);
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
      const errorMessage = error instanceof Error
        ? error.message
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
      const errorMessage = error instanceof Error
        ? error.message
        : 'No se pudo eliminar el grupo';
      showToast.error('Error', errorMessage);
    },
  });

  return {
    createGroup: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error instanceof Error
      ? createMutation.error.message
      : null,
    updateGroup: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteGroup: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};