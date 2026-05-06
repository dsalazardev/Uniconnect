import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OnboardingScreen.module.css';

interface OnboardingData {
  id_program: number;
  current_semester: number;
}

interface OnboardingScreenProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  programs?: Array<{ id_program: number; name: string }>;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  programs = [],
}) => {
  const navigate = useNavigate();
  const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
  const [currentSemester, setCurrentSemester] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProgram) {
      setError('Debes seleccionar un programa');
      return;
    }

    if (currentSemester < 1 || currentSemester > 12) {
      setError('El semestre debe estar entre 1 y 12');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onComplete({
        id_program: selectedProgram,
        current_semester: currentSemester,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al completar el onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Completa tu perfil</h1>
        <p className={styles.subtitle}>
          Necesitamos algunos datos para personalizar tu experiencia
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Programa Académico *</label>
            <select
              className={styles.select}
              value={selectedProgram || ''}
              onChange={(e) => setSelectedProgram(Number(e.target.value))}
              disabled={loading}
            >
              <option value="">Selecciona tu programa</option>
              {programs.map((program) => (
                <option key={program.id_program} value={program.id_program}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Semestre Actual *</label>
            <input
              type="number"
              className={styles.input}
              value={currentSemester}
              onChange={(e) => setCurrentSemester(Number(e.target.value))}
              min={1}
              max={12}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || !selectedProgram}
          >
            {loading ? 'Guardando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};
