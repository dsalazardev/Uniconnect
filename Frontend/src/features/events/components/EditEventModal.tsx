import React, { useState, useEffect } from 'react';
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
import { EventType, Event, UpdateEventPayload } from '../types/event.types';

interface EditEventModalProps {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
  onSave: (id: number, payload: UpdateEventPayload) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * EditEventModal - Pure UI component for event editing
 * Follows MVC pattern: only handles UI and emits data via onSave prop
 * Does NOT call services directly - maintains complete decoupling
 * 
 * ⭐ UX IMPROVEMENT: Uses native DateTimePicker for better user experience
 * ⭐ Preloads event data when event prop changes
 */
export const EditEventModal: React.FC<EditEventModalProps> = ({
  visible,
  event,
  onClose,
  onSave,
  isSubmitting = false,
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date>(new Date());
  const [location, setLocation] = useState('');
  const [type, setType] = useState<EventType>(EventType.CONFERENCIA);

  // DateTimePicker visibility state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Preload form fields with event data when event changes
   */
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setLocation(event.location);
      setType(event.type);

      // Parse date string (YYYY-MM-DD) to Date object
      if (event.date) {
        const [year, month, day] = event.date.split('-').map(Number);
        setDate(new Date(year, month - 1, day));
      }

      // Parse time string (HH:MM) to Date object
      if (event.time) {
        const [hours, minutes] = event.time.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
        setTime(timeDate);
      }
    }
  }, [event]);

  /**
   * Format date to YYYY-MM-DD
   */
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Format time to HH:MM
   */
  const formatTime = (time: Date): string => {
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  /**
   * Handle date change from DateTimePicker
   */
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  /**
   * Handle time change from DateTimePicker
   */
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (!location.trim()) {
      newErrors.location = 'La ubicación es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSave = async () => {
    if (!validateForm() || !event || !event.id_event) {
      console.error('❌ [EditEventModal] Invalid form or missing event ID:', { 
        hasEvent: !!event, 
        eventId: event?.id_event,
        formValid: validateForm() 
      });
      return;
    }

    // Emit data to parent via onSave prop
    const payload: UpdateEventPayload = {
      title: title.trim(),
      description: description.trim(),
      date: formatDate(date), // Format as YYYY-MM-DD
      time: formatTime(time), // Format as HH:MM
      location: location.trim(),
      type,
    };

    await onSave(event.id_event, payload);
  };

  /**
   * Reset form and close modal
   */
  const handleClose = () => {
    setErrors({});
    setShowDatePicker(false);
    setShowTimePicker(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      testID="edit-event-modal"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Editar Evento</Text>
              <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Title */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Título *</Text>
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="Ej: Conferencia de Inteligencia Artificial"
                  value={title}
                  onChangeText={setTitle}
                  editable={!isSubmitting}
                />
                {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
              </View>

              {/* Description */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Descripción *</Text>
                <TextInput
                  style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                  placeholder="Describe el evento..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
                {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
              </View>

              {/* Date - Native Picker */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Fecha *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateTimeButton]}
                  onPress={() => setShowDatePicker(true)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.dateTimeText}>{formatDate(date)}</Text>
                  <Text style={styles.dateTimeIcon}>📅</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              {/* Time - Native Picker */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Hora *</Text>
                <TouchableOpacity
                  style={[styles.input, styles.dateTimeButton]}
                  onPress={() => setShowTimePicker(true)}
                  disabled={isSubmitting}
                >
                  <Text style={styles.dateTimeText}>{formatTime(time)}</Text>
                  <Text style={styles.dateTimeIcon}>🕐</Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onTimeChange}
                    is24Hour={true}
                  />
                )}
              </View>

              {/* Location */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Ubicación *</Text>
                <TextInput
                  style={[styles.input, errors.location && styles.inputError]}
                  placeholder="Ej: Auditorio Principal"
                  value={location}
                  onChangeText={setLocation}
                  editable={!isSubmitting}
                />
                {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
              </View>

              {/* Type */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Tipo de Evento *</Text>
                <View style={styles.typeContainer}>
                  {Object.values(EventType).map((eventType) => (
                    <TouchableOpacity
                      key={eventType}
                      style={[
                        styles.typeButton,
                        type === eventType && styles.typeButtonActive,
                      ]}
                      onPress={() => setType(eventType)}
                      disabled={isSubmitting}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          type === eventType && styles.typeButtonTextActive,
                        ]}
                      >
                        {eventType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  scrollView: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  form: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
  },
  dateTimeIcon: {
    fontSize: 20,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
