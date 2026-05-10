import { useState, useEffect } from 'react';
import { studentsService } from '../services';
import type { PerfilBase, PerfilCompleto } from '@uniconnect/shared';

export function usePerfilBase(userId: number) {
  const [data, setData] = useState<PerfilBase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    studentsService
      .getPerfilBase(userId)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Error al cargar perfil'))
      .finally(() => setIsLoading(false));
  }, [userId]);

  return { data, isLoading, error };
}

export function usePerfilCompleto(userId: number, enabled = false) {
  const [data, setData] = useState<PerfilCompleto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !enabled) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setData(null);
    studentsService
      .getPerfilCompleto(userId)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'Error al cargar perfil completo');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [userId, enabled]);

  return { data, isLoading, error };
}
