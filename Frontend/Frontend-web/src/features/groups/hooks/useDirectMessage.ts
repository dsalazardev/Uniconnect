import { useState } from 'react';
import { groupsService } from '../services';
import { authStore } from '@/features/auth/store/AuthStore';
import { showToast } from '@/lib/toast';

/**
 * Hook para iniciar o retomar un chat privado con otro usuario.
 * Llama a POST /groups/direct-message/:targetUserId.
 *
 * Usa `loadingUserId` en lugar de un booleano para que cada botón
 * muestre su propio spinner sin afectar a los demás de la lista.
 * 
 * TODO: Implementar navegación con React Router
 */
export function useDirectMessage() {
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null);

  const openDirectMessage = async (targetUserId: number) => {
    if (!authStore.isAuthenticated) {
      showToast.error('Error', 'No hay sesión activa.');
      return;
    }

    setLoadingUserId(targetUserId);
    try {
      const response = await groupsService.findOrCreateDirectMessage(targetUserId);
      const groupId = response.group.id_group;
      // TODO: Implementar navegación con React Router
      console.log('Navigate to group:', groupId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'No se pudo abrir el chat privado.';
      showToast.error('Error', message);
    } finally {
      setLoadingUserId(null);
    }
  };

  return {
    openDirectMessage,
    loadingUserId,
    isAnyLoading: loadingUserId !== null,
  };
}
