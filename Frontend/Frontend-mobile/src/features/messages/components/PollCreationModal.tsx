import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CreatePollDto } from '@uniconnect/shared';

interface PollCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (dto: CreatePollDto) => Promise<void>;
}

const DURATION_PRESETS = [
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hora', ms: 60 * 60 * 1000 },
  { label: '3 horas', ms: 3 * 60 * 60 * 1000 },
  { label: '1 día', ms: 24 * 60 * 60 * 1000 },
];

export const PollCreationModal: React.FC<PollCreationModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setQuestion('');
    setOptions(['', '']);
    setSelectedPreset(null);
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const addOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async () => {
    setError(null);
    const validOptions = options.map((o) => o.trim()).filter(Boolean);

    if (!question.trim()) { setError('La pregunta no puede estar vacía.'); return; }
    if (validOptions.length < 2) { setError('Ingresa al menos 2 opciones.'); return; }
    if (selectedPreset === null) { setError('Selecciona la duración de la encuesta.'); return; }

    const closesAt = new Date(Date.now() + DURATION_PRESETS[selectedPreset].ms).toISOString();

    setSubmitting(true);
    try {
      await onSubmit({ question: question.trim(), options: validOptions, closesAt });
      reset();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al crear la encuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Nueva encuesta</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#D9B97E" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Pregunta */}
            <Text style={styles.label}>Pregunta</Text>
            <TextInput
              style={styles.input}
              placeholder="¿Cuál es tu pregunta?"
              placeholderTextColor="#555"
              value={question}
              onChangeText={setQuestion}
              maxLength={200}
            />

            {/* Opciones */}
            <Text style={styles.label}>Opciones</Text>
            {options.map((opt, i) => (
              <View key={i} style={styles.optionRow}>
                <Text style={styles.optionNum}>{i + 1}</Text>
                <TextInput
                  style={[styles.input, styles.optionInput]}
                  placeholder={`Opción ${i + 1}`}
                  placeholderTextColor="#555"
                  value={opt}
                  onChangeText={(v) => updateOption(i, v)}
                  maxLength={100}
                />
                {options.length > 2 && (
                  <TouchableOpacity onPress={() => removeOption(i)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {options.length < 5 && (
              <TouchableOpacity style={styles.addOptionBtn} onPress={addOption}>
                <Ionicons name="add" size={16} color="#D9B97E" />
                <Text style={styles.addOptionText}>Agregar opción</Text>
              </TouchableOpacity>
            )}

            {/* Duración */}
            <Text style={styles.label}>Duración</Text>
            <View style={styles.presetsRow}>
              {DURATION_PRESETS.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.preset, selectedPreset === i && styles.presetActive]}
                  onPress={() => setSelectedPreset(i)}
                >
                  <Text style={[styles.presetText, selectedPreset === i && styles.presetTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            {/* Acciones */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={submitting}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator size="small" color="#1a1a1a" />
                  : <Text style={styles.submitText}>Crear encuesta</Text>
                }
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 6,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  optionNum: {
    width: 20,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionInput: {
    flex: 1,
  },
  removeBtn: {
    padding: 6,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  addOptionText: {
    fontSize: 14,
    color: '#D9B97E',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#2a2a2a',
  },
  presetActive: {
    borderColor: '#D9B97E',
    backgroundColor: 'rgba(217,185,126,0.12)',
  },
  presetText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  presetTextActive: {
    color: '#D9B97E',
    fontWeight: '600',
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#D9B97E',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
});
