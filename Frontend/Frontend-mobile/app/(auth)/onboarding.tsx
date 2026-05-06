import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { observer } from 'mobx-react-lite';
import { usePrograms } from '@/src/features/programs/hooks/usePrograms';
import { authController } from '@/src/features/auth/controllers/AuthController';
import { authStore } from '@/src/features/auth/store/AuthStore';

const { width, height } = Dimensions.get('window');
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
const BOTTOM_BAR_HEIGHT = 100;
const SLIDE_HEIGHT = height - BOTTOM_BAR_HEIGHT - STATUS_BAR_HEIGHT;
const TOTAL_STEPS = 3;

// Colores del gradiente (hardcoded para evitar null/undefined)
const GRADIENT_COLORS = ['#1a1a1a', '#363636', '#2a2a2a'];

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

export default observer(function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const { data: programs, isLoading: loadingPrograms, isError: programsError } = usePrograms();
  const [selectedProgramId, setSelectedProgramId] = useState<number | undefined>(undefined);
  const [semesterText, setSemesterText] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ id_program?: string; current_semester?: string }>({});

  const isSubmitting = authStore.isLoading;

  const goToStep = (step: number) => {
    scrollRef.current?.scrollTo({ x: step * width, animated: true });
    setCurrentStep(step);
  };

  const handleScroll = (e: any) => {
    const step = Math.round(e.nativeEvent.contentOffset.x / width);
    if (step !== currentStep) setCurrentStep(step);
  };

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (selectedProgramId === undefined) {
      errors.id_program = 'Selecciona un programa académico.';
    }
    const semester = parseInt(semesterText, 10);
    if (!semesterText || isNaN(semester) || semester < 1 || !Number.isInteger(semester)) {
      errors.current_semester = 'Ingresa un semestre válido';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const semester = parseInt(semesterText, 10);
    setFieldErrors({});
    try {
      await authController.completeOnboarding(selectedProgramId!, semester);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 400) {
        const msg: string = error?.response?.data?.message || '';
        if (msg.toLowerCase().includes('semester')) {
          setFieldErrors({ current_semester: msg || 'Semestre inválido.' });
        } else {
          setFieldErrors({ id_program: msg, current_semester: msg });
        }
      } else if (status === 404) {
        setFieldErrors({ id_program: 'Programa no válido, selecciona otro.' });
      }
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      goToStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  return (
    <LinearGradient colors={GRADIENT_COLORS} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          bounces={false}
          style={styles.flex}
        >
          {/* SLIDE 1 - Bienvenida */}
          <View style={styles.slide}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/Logo_de_la_Universidad_de_Caldas.svg.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.welcomeLabel}>Bienvenido a</Text>
            <Text style={styles.titleGold}>UniConnect</Text>
            <Text style={styles.slideSubtitle}>Universidad de Caldas</Text>
            <View style={styles.divider} />
            <Text style={styles.tagline}>Tu plataforma de conexión estudiantil</Text>
          </View>

          {/* SLIDE 2 - Propuesta de valor */}
          <View style={styles.slide}>
            <Text style={styles.titleGold}>{'Todo conectado,\npara ti'}</Text>
            <View style={styles.divider} />
            <Text style={styles.featuresSubtitle}>
              UniConnect te acerca a los estudiantes, recursos y grupos que marcan la diferencia en tu carrera.
            </Text>
            <View style={styles.featuresGrid}>
              {FEATURES.map((f) => (
                <View key={f.title} style={styles.featureCard}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* SLIDE 3 - Perfil académico */}
          <View style={styles.slide}>
            <Text style={styles.titleGold}>{'Tu perfil\nacadémico'}</Text>
            <View style={styles.divider} />
            <Text style={styles.formSubtitle}>
              Solo necesitamos dos datos para conectarte con quienes realmente importan.
            </Text>

            <Text style={styles.fieldLabel}>Programa académico *</Text>
            {loadingPrograms ? (
              <ActivityIndicator color="#D9B97E" style={{ marginVertical: 14 }} />
            ) : programsError ? (
              <Text style={styles.errorText}>No se pudieron cargar los programas. Intenta de nuevo.</Text>
            ) : (
              <View style={[styles.pickerWrapper, fieldErrors.id_program ? styles.borderError : null]}>
                <Picker  
                  selectedValue={selectedProgramId}
                  onValueChange={(value) => {
                    setSelectedProgramId(value);
                    setFieldErrors((prev) => ({ ...prev, id_program: undefined }));
                  }}
                  style={styles.picker}
                  dropdownIconColor="#D9B97E"
                >
                  <Picker.Item label=" Selecciona tu programa " value={undefined} color="#888" />
                  {programs?.map((p) => (
                    <Picker.Item key={p.id_program} label={p.name} value={p.id_program} color="#1a1a1a" />
                  ))}
                </Picker>
              </View>
            )}
            {fieldErrors.id_program ? <Text style={styles.fieldError}>{fieldErrors.id_program}</Text> : null}

            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Semestre actual *</Text>
            <TextInput
              style={[styles.input, fieldErrors.current_semester ? styles.borderError : null]}
              keyboardType="number-pad"
              placeholder="Ej: 4"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={semesterText}
              onChangeText={(text) => {
                setSemesterText(text.replace(/[^0-9]/g, ''));
                setFieldErrors((prev) => ({ ...prev, current_semester: undefined }));
              }}
              maxLength={2}
            />
            {fieldErrors.current_semester ? <Text style={styles.fieldError}>{fieldErrors.current_semester}</Text> : null}
          </View>
        </ScrollView>

        {/* Barra inferior: puntos + botón */}
        <View style={styles.bottomBar}>
          <View style={styles.dotsRow}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <View key={i} style={[styles.dot, currentStep === i && styles.dotActive]} />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.nextBtn, isSubmitting && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#1a1a1a" />
            ) : (
              <Text style={styles.nextBtnText}>
                {currentStep === TOTAL_STEPS - 1 ? 'Guardar y continuar' : 'Siguiente  '}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  slide: {
    width,
    flex: 1,  
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Slide 1
  logoContainer: { marginBottom: 32, alignItems: 'center' },
  logo: { width: width * 0.5, height: 120, maxWidth: 250 },
  welcomeLabel: { fontSize: 18, color: '#fff', opacity: 0.85, marginBottom: 4 },
  titleGold: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#D9B97E',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  slideSubtitle: { fontSize: 15, color: '#fff', opacity: 0.9, marginBottom: 18 },
  divider: { width: 60, height: 3, backgroundColor: '#D9B97E', borderRadius: 2, marginBottom: 18 },
  tagline: { fontSize: 14, color: '#ccc', textAlign: 'center', letterSpacing: 0.5 },

  // Slide 2
  featuresSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.70)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  featuresGrid: { width: '100%', gap: 10 },
  featureCard: {
    borderLeftWidth: 2,
    borderLeftColor: '#D9B97E',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  featureTitle: { fontSize: 13, fontWeight: '700', color: '#D9B97E', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: 'rgba(255,255,255,0.60)', lineHeight: 17 },

  // Slide 3
  formSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  fieldLabel: { alignSelf: 'flex-start', fontSize: 14, fontWeight: '600', color: '#D9B97E', marginBottom: 8 },
  pickerWrapper: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(217,185,126,0.45)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    overflow: 'hidden',
  },
  picker: { height: 52, color: '#1a1a1a', width: '100%' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(217,185,126,0.45)',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
  },
  borderError: { borderColor: '#ef5350' },
  fieldError: { alignSelf: 'flex-start', fontSize: 12, color: '#ef5350', marginTop: 4 },
  errorText: { fontSize: 13, color: '#ef5350', textAlign: 'center', marginVertical: 8 },

  // Bottom bar
  bottomBar: {
    height: BOTTOM_BAR_HEIGHT,
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === 'ios' ? 16 : 10,
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.30)' },
  dotActive: { width: 24, backgroundColor: '#D9B97E' },
  nextBtn: { width: '100%', backgroundColor: '#D9B97E', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', letterSpacing: 0.3 },
});
