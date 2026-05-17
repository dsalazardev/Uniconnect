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
import type { CreateQuestionDto } from '@uniconnect/shared';

interface QuestionCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateQuestionDto) => Promise<void>;
}

export const QuestionCreationModal: React.FC<QuestionCreationModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setBody('');
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) { setError('El título no puede estar vacío.'); return; }
    if (!body.trim())  { setError('La descripción no puede estar vacía.'); return; }

    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), body: body.trim() });
      reset();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al publicar la pregunta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>

          <View style={styles.header}>
            <Text style={styles.title}>Nueva pregunta</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color="#D9B97E" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="¿Cuál es tu pregunta?"
              placeholderTextColor="#555"
              value={title}
              onChangeText={setTitle}
              maxLength={300}
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Explica tu pregunta con más detalle..."
              placeholderTextColor="#555"
              value={body}
              onChangeText={setBody}
              maxLength={2000}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {error && <Text style={styles.error}>{error}</Text>}

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
                  : <Text style={styles.submitText}>Publicar pregunta</Text>
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
    maxHeight: '88%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  label: {
    fontSize: 11,
    fontWeight: '700',
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
  textarea: {
    minHeight: 110,
    paddingTop: 11,
  },
  error: { color: '#EF4444', fontSize: 13, marginTop: 10 },
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
  cancelText: { fontSize: 15, color: '#9CA3AF' },
  submitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#D9B97E',
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
});
