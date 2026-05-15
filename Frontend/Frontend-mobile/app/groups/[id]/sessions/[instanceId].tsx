import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  studySessionsMobileService,
  type AttendanceStatus,
} from '@/src/features/study-sessions/services/study-sessions.service';
import type { StudySessionInstance } from '@uniconnect/shared';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ATTENDANCE_OPTIONS: { status: AttendanceStatus; label: string; icon: string; color: string }[] = [
  { status: 'CONFIRMED', label: 'Confirmar',  icon: 'checkmark-circle-outline', color: '#34D399' },
  { status: 'DECLINED',  label: 'Declinar',   icon: 'close-circle-outline',     color: '#EF4444' },
  { status: 'PENDING',   label: 'Pendiente',  icon: 'time-outline',              color: '#9CA3AF' },
];

export default function SessionDetailScreen() {
  const { id, instanceId } = useLocalSearchParams<{ id: string; instanceId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const groupId = parseInt(id as string);
  const instId = parseInt(instanceId as string);

  const [session, setSession] = useState<StudySessionInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStatus | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await studySessionsMobileService.getSessionsByGroup(groupId);
        const found = all.find((s) => s.id_instance === instId) ?? null;
        setSession(found);
        setError(found ? null : 'Sesión no encontrada.');
      } catch (err: any) {
        setError(err.message || 'Error al cargar la sesión.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId, instId]);

  const handleAttendance = async (status: AttendanceStatus) => {
    if (updating) return;
    setUpdating(true);
    try {
      await studySessionsMobileService.updateAttendance(groupId, instId, status);
      setAttendance(status);
    } catch (err: any) {
      // Show error without crashing
      console.error('Error updating attendance:', err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#D9B97E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle de sesión</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D9B97E" />
        </View>
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#D9B97E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle de sesión</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error || 'Sesión no encontrada.'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#D9B97E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {session.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Detalles */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{session.title}</Text>

          {session.description ? (
            <Text style={styles.description}>{session.description}</Text>
          ) : null}

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#D9B97E" />
            <Text style={styles.detailText}>{formatDateTime(session.scheduled_date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#D9B97E" />
            <Text style={styles.detailText}>{session.duration_minutes} minutos</Text>
          </View>

          {session.is_recurring && (
            <View style={styles.detailRow}>
              <Ionicons name="repeat" size={16} color="#D9B97E" />
              <Text style={styles.detailText}>Sesión recurrente (semanal)</Text>
            </View>
          )}
        </View>

        {/* RSVP */}
        <View style={styles.rsvpSection}>
          <Text style={styles.rsvpTitle}>Tu asistencia</Text>

          {updating ? (
            <View style={styles.updatingRow}>
              <ActivityIndicator size="small" color="#D9B97E" />
              <Text style={styles.updatingText}>Guardando...</Text>
            </View>
          ) : (
            <View style={styles.rsvpButtons}>
              {ATTENDANCE_OPTIONS.map((opt) => {
                const isActive = attendance === opt.status;
                return (
                  <TouchableOpacity
                    key={opt.status}
                    style={[styles.rsvpButton, isActive && styles.rsvpButtonActive]}
                    onPress={() => handleAttendance(opt.status)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={20}
                      color={isActive ? '#D9B97E' : opt.color}
                    />
                    <Text style={[styles.rsvpLabel, isActive && styles.rsvpLabelActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {attendance && (
            <Text style={styles.attendanceSaved}>
              ✓ Respuesta guardada:{' '}
              {ATTENDANCE_OPTIONS.find((o) => o.status === attendance)?.label}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    gap: 12,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  errorText: { fontSize: 14, color: '#EF4444', textAlign: 'center' },
  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(217,185,126,0.15)',
    gap: 12,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  description: { fontSize: 14, color: '#9CA3AF', lineHeight: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontSize: 14, color: '#e0e0e0', flex: 1 },
  // RSVP
  rsvpSection: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(217,185,126,0.15)',
    gap: 12,
  },
  rsvpTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  rsvpButtons: { flexDirection: 'row', gap: 10 },
  rsvpButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#1e1e1e',
  },
  rsvpButtonActive: {
    borderColor: '#D9B97E',
    backgroundColor: 'rgba(217,185,126,0.08)',
  },
  rsvpLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  rsvpLabelActive: { color: '#D9B97E' },
  updatingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  updatingText: { fontSize: 13, color: '#9CA3AF' },
  attendanceSaved: { fontSize: 12, color: '#34D399', textAlign: 'center' },
});
