import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ForumQuestion, ForumAnswer } from '@uniconnect/shared';
import { forumService } from '../services';

interface QuestionDetailProps {
  question: ForumQuestion;
  currentUserId: number;
  isTeacher: boolean;
  socket?: any;
  sortAnswers: (answers: ForumAnswer[]) => ForumAnswer[];
  onBack: () => void;
  onCreateAnswer: (questionId: number, dto: { body: string }) => Promise<ForumAnswer>;
}

export const QuestionDetail: React.FC<QuestionDetailProps> = ({
  question,
  currentUserId,
  isTeacher,
  socket,
  sortAnswers,
  onBack,
  onCreateAnswer,
}) => {
  const insets = useSafeAreaInsets();
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [answerBody, setAnswerBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadAnswers = useCallback(async () => {
    try {
      setLoadingAnswers(true);
      const data = await forumService.getAnswers(question.id);
      setAnswers(sortAnswers(data));
    } finally {
      setLoadingAnswers(false);
    }
  }, [question.id, sortAnswers]);

  // WebSocket: Observer — sin polling
  useEffect(() => {
    if (!socket) return;

    const handleVoteUpdated = (payload: { entityType: string; entityId: number; voteCount: number }) => {
      if (payload.entityType === 'ANSWER') {
        setAnswers((prev) =>
          sortAnswers(prev.map((a) => a.id === payload.entityId ? { ...a, voteCount: payload.voteCount } : a))
        );
      }
    };

    const handleAnswerAccepted = (payload: { questionId: number; answerId: number }) => {
      if (payload.questionId !== question.id) return;
      setAnswers((prev) =>
        sortAnswers(prev.map((a) => ({ ...a, isAccepted: a.id === payload.answerId })))
      );
    };

    socket.on('forum:vote_updated', handleVoteUpdated);
    socket.on('forum:answer_accepted', handleAnswerAccepted);
    return () => {
      socket.off('forum:vote_updated', handleVoteUpdated);
      socket.off('forum:answer_accepted', handleAnswerAccepted);
    };
  }, [socket, question.id, sortAnswers]);

  useEffect(() => { loadAnswers(); }, [loadAnswers]);

  const handleVoteAnswer = async (answerId: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers((prev) =>
      sortAnswers(prev.map((a) => a.id === answerId ? { ...a, voteCount: a.voteCount + 1 } : a))
    );
    try {
      const updated = await forumService.voteAnswer(answerId);
      setAnswers((prev) => sortAnswers(prev.map((a) => a.id === updated.id ? updated : a)));
    } catch {
      setAnswers((prev) =>
        sortAnswers(prev.map((a) => a.id === answerId ? { ...a, voteCount: a.voteCount - 1 } : a))
      );
    }
  };

  const handleAcceptAnswer = async (answerId: number) => {
    try {
      await forumService.acceptAnswer(answerId);
      setAnswers((prev) =>
        sortAnswers(prev.map((a) => ({ ...a, isAccepted: a.id === answerId })))
      );
    } catch { /* handled by server */ }
  };

  const handleSubmitAnswer = async () => {
    if (!answerBody.trim()) return;
    setSubmitting(true);
    try {
      const created = await onCreateAnswer(question.id, { body: answerBody.trim() });
      setAnswers((prev) => sortAnswers([...prev, created]));
      setAnswerBody('');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAnswer = ({ item }: { item: ForumAnswer }) => (
    <View style={[styles.answerItem, item.isAccepted && styles.answerAccepted]}>
      {item.isAccepted && (
        <View style={styles.acceptedBadge}>
          <Ionicons name="checkmark-circle" size={13} color="#34d399" />
          <Text style={styles.acceptedText}>Respuesta aceptada</Text>
        </View>
      )}
      <View style={styles.answerContent}>
        <TouchableOpacity
          style={styles.voteBtn}
          onPress={() => handleVoteAnswer(item.id)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons name="chevron-up" size={16} color="#D9B97E" />
          <Text style={styles.voteCount}>{item.voteCount}</Text>
        </TouchableOpacity>

        <View style={styles.answerBody}>
          <Text style={styles.answerText}>{item.body}</Text>
          <Text style={styles.meta}>ID {item.authorId}</Text>
        </View>

        {isTeacher && !item.isAccepted && question.status === 'OPEN' && (
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAcceptAnswer(item.id)}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#34d399" />
            <Text style={styles.acceptBtnText}>Aceptar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : -10}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#D9B97E" />
          <Text style={styles.backText}>Foro</Text>
        </TouchableOpacity>
        <View style={[styles.statusBadge, question.status === 'RESOLVED' ? styles.badgeResolved : styles.badgeOpen]}>
          <Text style={[styles.statusText, question.status === 'RESOLVED' ? styles.textResolved : styles.textOpen]}>
            {question.status === 'RESOLVED' ? 'RESUELTA' : 'ABIERTA'}
          </Text>
        </View>
      </View>

      {/* Pregunta */}
      <View style={styles.questionCard}>
        <Text style={styles.questionTitle}>{question.title}</Text>
        <Text style={styles.questionBody}>{question.body}</Text>
      </View>

      {/* Respuestas */}
      {loadingAnswers ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#D9B97E" />
        </View>
      ) : (
        <FlatList
          data={answers}
          renderItem={renderAnswer}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.answerList}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {answers.length} {answers.length === 1 ? 'respuesta' : 'respuestas'}
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.emptyAnswers}>Aún no hay respuestas. ¡Sé el primero!</Text>
          }
        />
      )}

      {/* Input respuesta */}
      <View style={[styles.replyBox, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.replyInput}
          placeholder="Escribe tu respuesta..."
          placeholderTextColor="#555"
          value={answerBody}
          onChangeText={setAnswerBody}
          maxLength={2000}
          multiline
        />
        <TouchableOpacity
          style={[styles.replyBtn, (!answerBody.trim() || submitting) && styles.replyBtnDisabled]}
          onPress={handleSubmitAnswer}
          disabled={!answerBody.trim() || submitting}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#1a1a1a" />
            : <Ionicons name="send" size={18} color="#1a1a1a" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2a2a2a' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 14, fontWeight: '600', color: '#D9B97E' },
  statusBadge: { marginLeft: 'auto', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  badgeOpen: { backgroundColor: 'rgba(217,185,126,0.15)', borderColor: 'rgba(217,185,126,0.35)' },
  badgeResolved: { backgroundColor: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.3)' },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  textOpen: { color: '#D9B97E' },
  textResolved: { color: '#34d399' },

  questionCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  questionTitle: { fontSize: 16, fontWeight: '700', color: '#f0f0f0', lineHeight: 22 },
  questionBody: { fontSize: 14, color: '#ccc', lineHeight: 21 },

  loadingRow: { padding: 24, alignItems: 'center' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  answerList: { padding: 12 },
  emptyAnswers: { fontSize: 13, color: '#555', textAlign: 'center', paddingVertical: 24 },

  answerItem: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  answerAccepted: { borderColor: 'rgba(52,211,153,0.35)' },
  acceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52,211,153,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(52,211,153,0.2)',
  },
  acceptedText: { fontSize: 11, fontWeight: '700', color: '#34d399' },

  answerContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  voteBtn: { alignItems: 'center', gap: 2, paddingHorizontal: 4 },
  voteCount: { fontSize: 13, fontWeight: '700', color: '#D9B97E' },
  answerBody: { flex: 1, gap: 4 },
  answerText: { fontSize: 14, color: '#e0e0e0', lineHeight: 21 },
  meta: { fontSize: 11, color: '#555' },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  acceptBtnText: { fontSize: 11, fontWeight: '600', color: '#34d399' },

  replyBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#2a2a2a',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  replyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D9B97E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyBtnDisabled: { opacity: 0.4 },
});
