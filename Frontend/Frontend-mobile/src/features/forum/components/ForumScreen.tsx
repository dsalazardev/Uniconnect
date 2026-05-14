import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ForumQuestion } from '@uniconnect/shared';
import { useForum } from '../hooks/useForum';
import { QuestionCreationModal } from './QuestionCreationModal';
import { QuestionDetail } from './QuestionDetail';

interface ForumScreenProps {
  subjectId: number;
  currentUserId: number;
  isTeacher: boolean;
  socket?: any;
}

export const ForumScreen: React.FC<ForumScreenProps> = ({
  subjectId,
  currentUserId,
  isTeacher,
  socket,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ForumQuestion | null>(null);

  const { questions, loading, error, createQuestion, createAnswer, castVoteQuestion, sortAnswers } = useForum({
    subjectId,
    socket,
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D9B97E" />
        <Text style={styles.loadingText}>Cargando foro...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={44} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (selectedQuestion) {
    return (
      <QuestionDetail
        question={selectedQuestion}
        currentUserId={currentUserId}
        isTeacher={isTeacher}
        socket={socket}
        sortAnswers={sortAnswers}
        onBack={() => setSelectedQuestion(null)}
        onCreateAnswer={createAnswer}
      />
    );
  }

  const renderQuestion = ({ item }: { item: ForumQuestion }) => (
    <TouchableOpacity style={styles.item} onPress={() => setSelectedQuestion(item)} activeOpacity={0.75}>
      <TouchableOpacity
        style={styles.voteBtn}
        onPress={() => castVoteQuestion(item.id)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="chevron-up" size={18} color="#D9B97E" />
        <Text style={styles.voteCount}>{item.voteCount}</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.itemHeader}>
          <View style={[styles.badge, item.status === 'RESOLVED' ? styles.badgeResolved : styles.badgeOpen]}>
            <Text style={[styles.badgeText, item.status === 'RESOLVED' ? styles.badgeTextResolved : styles.badgeTextOpen]}>
              {item.status === 'RESOLVED' ? 'RESUELTA' : 'ABIERTA'}
            </Text>
          </View>
          <View style={styles.answersRow}>
            <Ionicons name="chatbubble-outline" size={12} color="#555" />
            <Text style={styles.answersText}>{item.answerCount ?? 0}</Text>
          </View>
        </View>
        <Text style={styles.questionTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.questionBody} numberOfLines={2}>{item.body}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="chatbubbles-outline" size={20} color="#D9B97E" />
          <Text style={styles.headerTitle}>Foro de preguntas</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{questions.length}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={18} color="#1a1a1a" />
          <Text style={styles.newBtnText}>Nueva</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={questions}
        renderItem={renderQuestion}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={questions.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={44} color="#444" />
            <Text style={styles.emptyText}>Aún no hay preguntas.{'\n'}¡Sé el primero en preguntar!</Text>
          </View>
        }
      />

      <QuestionCreationModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createQuestion}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2a2a2a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#2a2a2a' },
  loadingText: { fontSize: 14, color: '#9CA3AF' },
  errorText: { fontSize: 14, color: '#EF4444', textAlign: 'center', paddingHorizontal: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#f0f0f0' },
  countBadge: {
    backgroundColor: 'rgba(217,185,126,0.15)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countText: { fontSize: 12, fontWeight: '600', color: '#D9B97E' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D9B97E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },

  listContent: { padding: 12, gap: 8 },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 80 },
  emptyText: { fontSize: 14, color: '#555', textAlign: 'center', lineHeight: 22 },

  item: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  voteBtn: { alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  voteCount: { fontSize: 13, fontWeight: '700', color: '#D9B97E' },

  content: { flex: 1, gap: 5 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeOpen: { backgroundColor: 'rgba(217,185,126,0.15)', borderColor: 'rgba(217,185,126,0.35)' },
  badgeResolved: { backgroundColor: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.3)' },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  badgeTextOpen: { color: '#D9B97E' },
  badgeTextResolved: { color: '#34d399' },
  answersRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  answersText: { fontSize: 11, color: '#555' },

  questionTitle: { fontSize: 14, fontWeight: '600', color: '#f0f0f0', lineHeight: 20 },
  questionBody: { fontSize: 13, color: '#888', lineHeight: 18 },
});
