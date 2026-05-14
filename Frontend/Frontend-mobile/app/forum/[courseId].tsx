import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authStore } from '@/src/features/auth';
import { ForumScreen } from '@/src/features/forum/components/ForumScreen';

export default function CourseForumScreen() {
  const { courseId, courseName } = useLocalSearchParams<{ courseId: string; courseName?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = authStore.user?.id_user ?? 0;
  const isTeacher = false; // TODO: derivar de membresía cuando se implemente rol docente

  if (!courseId) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#D9B97E" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {courseName || 'Foro de asignatura'}
          </Text>
          <Text style={styles.headerSub}>Preguntas y respuestas</Text>
        </View>
      </View>

      <ForumScreen
        courseId={parseInt(courseId)}
        currentUserId={userId}
        isTeacher={isTeacher}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2a2a2a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217,185,126,0.15)',
  },
  backBtn: { padding: 6 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#9CA3AF' },
});
