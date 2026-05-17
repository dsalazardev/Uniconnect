import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EventCategory {
  id_category: number;
  name: string;
  color: string;
}

export interface CreateEventFormPayload {
  id_category: number;
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
}

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventFormPayload) => void;
  isSubmitting?: boolean;
  categories?: EventCategory[];
}

type PickerTarget = 'start_date' | 'start_time' | 'end_date' | 'end_time' | null;

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
  categories = [],
}) => {
  const [idCategory, setIdCategory] = useState<number | null>(null);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCat = categories.find((c) => c.id_category === idCategory);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!idCategory) e.category = 'Selecciona una categoría';
    if (!title.trim()) e.title = 'El título es obligatorio';
    if (!description.trim()) e.description = 'La descripción es obligatoria';
    if (!location.trim()) e.location = 'La ubicación es obligatoria';
    if (endDate <= startDate) e.end_date = 'La fecha de fin debe ser posterior al inicio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !idCategory) return;
    onSubmit({
      id_category: idCategory,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    });
  };

  const handleClose = () => {
    setIdCategory(null); setTitle(''); setDescription(''); setLocation('');
    setStartDate(new Date()); setEndDate(new Date());
    setErrors({}); setPickerTarget(null); setShowCatPicker(false);
    onClose();
  };

  const handlePickerChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setPickerTarget(null);
    if (!selected) return;
    if (pickerTarget === 'start_date') {
      const d = new Date(startDate);
      d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setStartDate(d);
    } else if (pickerTarget === 'start_time') {
      const d = new Date(startDate);
      d.setHours(selected.getHours(), selected.getMinutes());
      setStartDate(d);
    } else if (pickerTarget === 'end_date') {
      const d = new Date(endDate);
      d.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setEndDate(d);
    } else if (pickerTarget === 'end_time') {
      const d = new Date(endDate);
      d.setHours(selected.getHours(), selected.getMinutes());
      setEndDate(d);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Crear Nuevo Evento</Text>
              <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Categoría */}
            <View style={styles.field}>
              <Text style={styles.label}>Categoría *</Text>
              <TouchableOpacity
                style={[styles.input, styles.selectRow, errors.category && styles.inputError]}
                onPress={() => setShowCatPicker(true)}
                disabled={isSubmitting}
              >
                <Text style={selectedCat ? styles.selectText : styles.selectPlaceholder}>
                  {selectedCat ? selectedCat.name : 'Seleccionar categoría'}
                </Text>
                <Text style={styles.chevron}>▾</Text>
              </TouchableOpacity>
              {errors.category && <Text style={styles.error}>{errors.category}</Text>}
            </View>

            {/* Título */}
            <View style={styles.field}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Ej: Conferencia de Inteligencia Artificial"
                placeholderTextColor="#6B7280"
                value={title} onChangeText={setTitle}
                editable={!isSubmitting} maxLength={300}
              />
              {errors.title && <Text style={styles.error}>{errors.title}</Text>}
            </View>

            {/* Descripción */}
            <View style={styles.field}>
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                placeholder="Describe el evento..."
                placeholderTextColor="#6B7280"
                value={description} onChangeText={setDescription}
                multiline numberOfLines={4} textAlignVertical="top"
                editable={!isSubmitting} maxLength={2000}
              />
              {errors.description && <Text style={styles.error}>{errors.description}</Text>}
            </View>

            {/* Ubicación */}
            <View style={styles.field}>
              <Text style={styles.label}>Ubicación *</Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                placeholder="Ej: Auditorio Principal"
                placeholderTextColor="#6B7280"
                value={location} onChangeText={setLocation}
                editable={!isSubmitting} maxLength={300}
              />
              {errors.location && <Text style={styles.error}>{errors.location}</Text>}
            </View>

            {/* Fecha/hora inicio */}
            <View style={styles.field}>
              <Text style={styles.label}>Inicio *</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.input, styles.datePart]}
                  onPress={() => setPickerTarget('start_date')}
                  disabled={isSubmitting}
                >
                  <Text style={styles.selectText}>📅 {fmt(startDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.input, styles.timePart]}
                  onPress={() => setPickerTarget('start_time')}
                  disabled={isSubmitting}
                >
                  <Text style={styles.selectText}>🕐 {fmtTime(startDate)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Fecha/hora fin */}
            <View style={styles.field}>
              <Text style={styles.label}>Fin *</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.input, styles.datePart, errors.end_date && styles.inputError]}
                  onPress={() => setPickerTarget('end_date')}
                  disabled={isSubmitting}
                >
                  <Text style={styles.selectText}>📅 {fmt(endDate)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.input, styles.timePart]}
                  onPress={() => setPickerTarget('end_time')}
                  disabled={isSubmitting}
                >
                  <Text style={styles.selectText}>🕐 {fmtTime(endDate)}</Text>
                </TouchableOpacity>
              </View>
              {errors.end_date && <Text style={styles.error}>{errors.end_date}</Text>}
            </View>

            {/* Acciones */}
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={handleClose} disabled={isSubmitting}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.submitBtn, isSubmitting && styles.submitDisabled]}
                onPress={handleSubmit} disabled={isSubmitting}
              >
                <Text style={styles.submitText}>{isSubmitting ? 'Creando...' : 'Crear Evento'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Native date/time picker */}
      {pickerTarget !== null && (
        <DateTimePicker
          value={pickerTarget === 'start_date' || pickerTarget === 'start_time' ? startDate : endDate}
          mode={pickerTarget === 'start_time' || pickerTarget === 'end_time' ? 'time' : 'date'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handlePickerChange}
          is24Hour
        />
      )}

      {/* Category picker modal */}
      <Modal visible={showCatPicker} transparent animationType="fade" onRequestClose={() => setShowCatPicker(false)}>
        <TouchableOpacity style={styles.catOverlay} activeOpacity={1} onPress={() => setShowCatPicker(false)}>
          <View style={styles.catSheet}>
            <Text style={styles.catTitle}>Categoría</Text>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id_category}
                style={[styles.catOption, idCategory === c.id_category && styles.catOptionActive]}
                onPress={() => { setIdCategory(c.id_category); setShowCatPicker(false); }}
              >
                <Text style={[styles.catOptionText, idCategory === c.id_category && styles.catOptionTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#1e1e1e', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  closeBtn: { fontSize: 22, color: '#aaa', fontWeight: 'bold' },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#aaa', marginBottom: 6 },
  input: { backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: 'rgba(217,185,126,0.2)', borderRadius: 8, padding: 11, color: '#fff', fontSize: 14 },
  inputError: { borderColor: '#EF4444' },
  textArea: { minHeight: 90, paddingTop: 11 },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectText: { color: '#fff', fontSize: 14 },
  selectPlaceholder: { color: '#6B7280', fontSize: 14 },
  chevron: { color: '#6B7280', fontSize: 16 },
  dateRow: { flexDirection: 'row', gap: 8 },
  datePart: { flex: 3 },
  timePart: { flex: 2 },
  error: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 8 },
  btn: { flex: 1, paddingVertical: 13, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#444' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#aaa' },
  submitBtn: { backgroundColor: '#D9B97E' },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontSize: 15, fontWeight: '700', color: '#111' },
  catOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  catSheet: { backgroundColor: '#2a2a2a', borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: 16, paddingBottom: 32 },
  catTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  catOption: { paddingVertical: 13, paddingHorizontal: 8, borderRadius: 8, marginBottom: 4 },
  catOptionActive: { backgroundColor: 'rgba(217,185,126,0.15)' },
  catOptionText: { fontSize: 15, color: '#ccc' },
  catOptionTextActive: { color: '#D9B97E', fontWeight: '700' },
});
