import { useState, useEffect } from 'react';
import { studentsService } from '../services';
import type { PerfilBase, PerfilCompleto } from '@uniconnect/shared';

export function usePerfilBase(userId: number) {
  const [data, setData] = useState<PerfilBase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    studentsService
      .getPerfilBase(userId)
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [userId]);

  return { data, isLoading, error };
}

export function usePerfilCompleto(userId: number, enabled = false) {
  const [data, setData] = useState<PerfilCompleto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !enabled) return;
    setIsLoading(true);
    studentsService
      .getPerfilCompleto(userId)
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [userId, enabled]);

  return { data, isLoading, error };
}
