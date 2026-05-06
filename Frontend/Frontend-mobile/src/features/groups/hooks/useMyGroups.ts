import { useQuery, useQueryClient } from '@tanstack/react-query';
import { groupsService } from '../services';
import { Group } from '../types';

export const useMyGroups = (userId: number | undefined) => {
  const { data: myGroups = [], isLoading: loading, isError, error: queryError, refetch } = useQuery({
    queryKey: ['myGroups', userId],
    queryFn: () => groupsService.getMemberGroups(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minuto
  });

  const error = isError ? (queryError instanceof Error ? queryError.message : 'Error al cargar mis grupos') : null;

  return {
    myGroups,
    loading,
    error,
    reloadMyGroups: refetch,
  };
};

export const useCreatedGroups = (userId: number | undefined) => {
  const { data: createdGroups = [], isLoading: loading, isError, error: queryError, refetch } = useQuery({
    queryKey: ['createdGroups', userId],
    queryFn: () => groupsService.getCreatedGroups(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minuto
  });

  const error = isError ? (queryError instanceof Error ? queryError.message : 'Error al cargar grupos creados') : null;

  return {
    createdGroups,
    loading,
    error,
    reloadCreatedGroups: refetch,
  };
};

export const useDiscoverGroups = (userId: number | undefined) => {
  const { data: groups = [], isLoading: loading, isError, error: queryError, refetch } = useQuery({
    queryKey: ['discoverGroups', userId],
    queryFn: () => groupsService.discoverGroups(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minuto
  });

  const error = isError ? (queryError instanceof Error ? queryError.message : 'Error al descubrir grupos') : null;

  return {
    groups,
    loading,
    error,
    reloadDiscoverGroups: refetch,
  };
};

export const useGroupDetail = (groupId: number | undefined) => {
  const { data: group = null, isLoading: loading, isError, error: queryError, refetch } = useQuery({
    queryKey: ['groupDetail', groupId],
    queryFn: () => groupsService.getGroupDetail(groupId!),
    enabled: !!groupId,
    staleTime: 1000 * 60, // 1 minuto
  });

  const error = isError ? (queryError instanceof Error ? queryError.message : 'Error al cargar detalle del grupo') : null;

  return {
    group,
    loading,
    error,
    reloadGroupDetail: refetch,
  };
};
