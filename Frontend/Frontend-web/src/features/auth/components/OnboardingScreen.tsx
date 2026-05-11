import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { usePrograms } from '@/features/programs/hooks/usePrograms';
import styles from './OnboardingScreen.module.css';

const TOTAL_STEPS = 3;

const FEATURES = [
  {
    title: 'Conexiones académicas',
    desc: 'Encuentra compañeros del mismo programa, semestre o con materias en común.',
  },
  {
    title: 'Comunidad viva',
    desc: 'Comparte recursos y aprende de quienes ya cursaron tus asignaturas.',
  },
  {
    title: 'Grupos de estudio',
    desc: 'Crea o únete a grupos temáticos y organiza proyectos académicos en equipo.',
  },
  {
    title: 'Alertas relevantes',
    desc: 'Notificaciones personalizadas sobre tu actividad y conexiones.',
  },
];

interface OnboardingScreenProps {
  onComplete: (data: { id_program: number; current_semester: number }) => Promise<void>;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProgramId, setSelectedProgramId] = useState<number | undefined>(undefined);
  const [semesterText, setSemesterText] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ id_program?: string; current_semester?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: programs, isLoading: loadingPrograms, isError: programsError } = usePrograms();

  const goToStep = (step: number) => setCurrentStep(step);

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (selectedProgramId === undefined) {
      errors.id_program = 'Selecciona un programa académico.';
    }
    const semester = parseInt(semesterText, 10);
    if (!semesterText || isNaN(semester) || semester < 1 || semester > 12 || !Number.isInteger(semester)) {
      errors.current_semester = 'Ingresa un semestre válido (1–12).';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const semester = parseInt(semesterText, 10);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await onComplete({ id_program: selectedProgramId!, current_semester: semester });
    } catch (error: any) {
      const status = error?.response?.status;
      const msg: string = error?.response?.data?.message || error?.message || '';
      if (status === 400) {
        if (msg.toLowerCase().includes('semester')) {
          setFieldErrors({ current_semester: msg || 'Semestre inválido.' });
        } else {
          setFieldErrors({ id_program: msg || 'Datos inválidos.' });
        }
      } else if (status === 404) {
        setFieldErrors({ id_program: 'Programa no válido, selecciona otro.' });
      } else {
        setFieldErrors({ id_program: msg || 'Error al guardar perfil. Intenta de nuevo.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) goToStep(currentStep - 1);
  };

  return (
    <div className={styles.page}>
      {/* ── Slides viewport ── */}
      <div className={styles.slidesViewport}>
        <div
          className={styles.slidesTrack}
          style={{ transform: `translateX(calc(${currentStep} * -100vw))` }}
        >
          {/* SLIDE 1 — Bienvenida */}
          <div className={styles.slide}>
            <div className={styles.slideContent}>
              <div className={styles.logoContainer}>
                <GraduationCap size={72} className={styles.logoIcon} />
              </div>
              <p className={styles.welcomeLabel}>Bienvenido a</p>
              <h1 className={styles.titleGold}>UniConnect</h1>
              <p className={styles.slideSubtitle}>Universidad de Caldas</p>
              <div className={styles.divider} />
              <p className={styles.tagline}>Tu plataforma de conexión estudiantil</p>
            </div>
          </div>

          {/* SLIDE 2 — Propuesta de valor */}
          <div className={styles.slide}>
            <div className={styles.slideContent}>
              <h1 className={styles.titleGold}>Todo conectado,<br />para ti</h1>
              <div className={styles.divider} />
              <p className={styles.featuresSubtitle}>
                UniConnect te acerca a los estudiantes, recursos y grupos que marcan
                la diferencia en tu carrera.
              </p>
              <div className={styles.featuresGrid}>
                {FEATURES.map((f) => (
                  <div key={f.title} className={styles.featureCard}>
                    <p className={styles.featureTitle}>{f.title}</p>
                    <p className={styles.featureDesc}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SLIDE 3 — Perfil académico */}
          <div className={styles.slide}>
            <div className={styles.slideContent}>
              <h1 className={styles.titleGold}>Tu perfil<br />académico</h1>
              <div className={styles.divider} />
              <p className={styles.formSubtitle}>
                Solo necesitamos dos datos para conectarte con quienes realmente importan.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Programa académico *</label>
                {loadingPrograms ? (
                  <div className={styles.loadingRow}>
                    <span className={styles.spinnerGold} />
                    <span className={styles.loadingText}>Cargando programas...</span>
                  </div>
                ) : programsError ? (
                  <p className={styles.errorText}>
                    No se pudieron cargar los programas. Intenta de nuevo.
                  </p>
                ) : (
                  <select
                    className={`${styles.select} ${fieldErrors.id_program ? styles.fieldInputError : ''}`}
                    value={selectedProgramId ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedProgramId(val ? Number(val) : undefined);
                      setFieldErrors((prev) => ({ ...prev, id_program: undefined }));
                    }}
                    disabled={isSubmitting}
                  >
                    <option value="">Selecciona tu programa</option>
                    {programs?.map((p) => (
                      <option key={p.id_program} value={p.id_program}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                {fieldErrors.id_program && (
                  <span className={styles.fieldError}>{fieldErrors.id_program}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Semestre actual *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className={`${styles.input} ${fieldErrors.current_semester ? styles.fieldInputError : ''}`}
                  placeholder="Ej: 4"
                  value={semesterText}
                  onChange={(e) => {
                    setSemesterText(e.target.value.replace(/[^0-9]/g, ''));
                    setFieldErrors((prev) => ({ ...prev, current_semester: undefined }));
                  }}
                  maxLength={2}
                  disabled={isSubmitting}
                />
                {fieldErrors.current_semester && (
                  <span className={styles.fieldError}>{fieldErrors.current_semester}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className={styles.bottomBar}>
        <div className={styles.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`${styles.dot} ${currentStep === i ? styles.dotActive : ''}`}
            />
          ))}
        </div>
        <div className={styles.buttonsRow}>
          {currentStep > 0 && (
            <button
              className={styles.backBtn}
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Atrás
            </button>
          )}
          <button
            className={`${styles.nextBtn} ${isSubmitting ? styles.nextBtnDisabled : ''}`}
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className={styles.spinnerDark} />
            ) : currentStep === TOTAL_STEPS - 1 ? (
              'Guardar y continuar'
            ) : (
              'Siguiente →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
