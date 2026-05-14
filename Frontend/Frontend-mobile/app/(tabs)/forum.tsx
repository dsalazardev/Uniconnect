import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/src/constants/api';
import { forumService } from '@/src/features/forum/services';
import { websocketService } from '@/src/features/messages/services/websocket.service';
import { authStore } from '@/src/features/auth';
import type { ForumQuestion, ForumAnswer } from '@uniconnect/shared';
import { QuestionCreationModal } from '@/src/features/forum/components/QuestionCreationModal';

interface Course { id_course: number; name: string; code?: string; isEnrolled: boolean; }

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function ForumDashboard() {
  const insets = useSafeAreaInsets();
  const currentUserId = authStore.user?.id_user ?? 0;
  const isTeacher = false;

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQ, setLoadingQ] = useState(false);

  // Thread
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const expandedIdRef = useRef<number | null>(null);
  const [threadAnswers, setThreadAnswers] = useState<ForumAnswer[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // New question modal
  const [showModal, setShowModal] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // ── Courses ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get('/courses/get-by-student')
      .then((r) => {
        const list: Course[] = Array.isArray(r.data) ? r.data : r.data?.courses ?? [];
        setCourses(list);
        if (list.length > 0) setSelectedId(list[0].id_course);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, []);

  // ── Questions ─────────────────────────────────────────────────────────────────
  const loadQuestions = useCallback(async (cId: number) => {
    setLoadingQ(true);
    setExpandedId(null);
    try {
      const data = await forumService.getQuestions(cId);
      setQuestions([...data].sort((a, b) => b.voteCount - a.voteCount));
    } finally { setLoadingQ(false); }
  }, []);

  useEffect(() => {
    expandedIdRef.current = expandedId;
  }, [expandedId]);

  useEffect(() => {
    if (!selectedId) return;
    websocketService.emit('forum:join', { groupId: selectedId });
    loadQuestions(selectedId);
  }, [selectedId, loadQuestions]);

  // ── WebSocket ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onVote = (p: { entityType: string; entityId: number; voteCount: number }) => {
      if (p.entityType === 'QUESTION') {
        setQuestions((prev) =>
          [...prev.map((q) => q.id === p.entityId ? { ...q, voteCount: p.voteCount } : q)]
            .sort((a, b) => b.voteCount - a.voteCount)
        );
      } else {
        setThreadAnswers((prev) => prev.map((a) => a.id === p.entityId ? { ...a, voteCount: p.voteCount } : a));
      }
    };
    const onAccepted = (p: { questionId: number; answerId: number }) => {
      setQuestions((prev) => prev.map((q) => q.id === p.questionId ? { ...q, status: 'RESOLVED' as const } : q));
      setThreadAnswers((prev) => prev.map((a) => ({ ...a, isAccepted: a.id === p.answerId })));
    };
    const onQuestionCreated = (q: ForumQuestion) => {
      setQuestions((prev) => {
        if (prev.some((x) => x.id === q.id)) return prev;
        return [q, ...prev];
      });
    };
    const onAnswerCreated = (p: { questionId: number; answer: ForumAnswer }) => {
      setQuestions((prev) =>
        prev.map((q) => q.id === p.questionId ? { ...q, answerCount: (q.answerCount ?? 0) + 1 } : q)
      );
      if (expandedIdRef.current === p.questionId) {
        setThreadAnswers((prev) => {
          if (prev.some((a) => a.id === p.answer.id)) return prev;
          return [...prev, p.answer];
        });
      }
    };
    websocketService.on('forum:vote_updated', onVote);
    websocketService.on('forum:answer_accepted', onAccepted);
    websocketService.on('forum:question_created', onQuestionCreated);
    websocketService.on('forum:answer_created', onAnswerCreated);
    return () => {
      websocketService.off('forum:vote_updated', onVote);
      websocketService.off('forum:answer_accepted', onAccepted);
      websocketService.off('forum:question_created', onQuestionCreated);
      websocketService.off('forum:answer_created', onAnswerCreated);
    };
  }, []);

  // ── Thread ───────────────────────────────────────────────────────────────────
  const toggleThread = async (qId: number) => {
    if (expandedId === qId) { setExpandedId(null); return; }
    setExpandedId(qId);
    setLoadingThread(true);
    setReplyBody('');
    try {
      const answers = await forumService.getAnswers(qId);
      setThreadAnswers([...answers].sort((a, b) => {
        if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
        return b.voteCount - a.voteCount;
      }));
    } finally { setLoadingThread(false); }
  };

  const voteQuestion = async (qId: number) => {
    let wasVoted = false;
    setQuestions((prev) => {
      const q = prev.find((x) => x.id === qId);
      wasVoted = q?.userVoted ?? false;
      return [...prev.map((x) => x.id === qId
        ? { ...x, voteCount: wasVoted ? x.voteCount - 1 : x.voteCount + 1, userVoted: !wasVoted }
        : x
      )].sort((a, b) => b.voteCount - a.voteCount);
    });
    try { await forumService.voteQuestion(qId); }
    catch {
      setQuestions((prev) =>
        [...prev.map((x) => x.id === qId
          ? { ...x, voteCount: wasVoted ? x.voteCount + 1 : x.voteCount - 1, userVoted: wasVoted }
          : x
        )].sort((a, b) => b.voteCount - a.voteCount)
      );
    }
  };

  const voteAnswer = async (aId: number) => {
    let wasVoted = false;
    setThreadAnswers((prev) => {
      const a = prev.find((x) => x.id === aId);
      wasVoted = a?.userVoted ?? false;
      return prev.map((x) => x.id === aId
        ? { ...x, voteCount: wasVoted ? x.voteCount - 1 : x.voteCount + 1, userVoted: !wasVoted }
        : x
      );
    });
    try { await forumService.voteAnswer(aId); }
    catch {
      setThreadAnswers((prev) => prev.map((x) => x.id === aId
        ? { ...x, voteCount: wasVoted ? x.voteCount + 1 : x.voteCount - 1, userVoted: wasVoted }
        : x
      ));
    }
  };

  const submitReply = async (questionId: number) => {
    if (!replyBody.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const created = await forumService.createAnswer(questionId, { body: replyBody.trim() });
      setThreadAnswers((prev) => [...prev, created]);
      setQuestions((prev) => prev.map((q) => q.id === questionId ? { ...q, answerCount: (q.answerCount ?? 0) + 1 } : q));
      setReplyBody('');
    } catch (err: any) {
      Alert.alert('Foro', err?.response?.data?.message || 'Error al responder.');
    } finally { setSubmittingReply(false); }
  };

  const handleCreateQuestion = async (dto: { title: string; body: string }) => {
    if (!selectedId) return;
    const created = await forumService.createQuestion(selectedId, dto);
    setQuestions((prev) => [created, ...prev]);
  };

  // ── Render question item ──────────────────────────────────────────────────────
  const renderQuestion = ({ item: q }: { item: ForumQuestion }) => {
    const isExpanded = expandedId === q.id;
    return (
      <View style={[styles.thread, isExpanded && styles.threadExpanded]}>

        {/* Question */}
        <TouchableOpacity style={styles.tweet} onPress={() => toggleThread(q.id)} activeOpacity={0.8}>
          {isExpanded && <View style={styles.threadLine} />}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{q.authorName?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.tweetBody}>
            <View style={styles.tweetMeta}>
              <Text style={styles.tweetAuthor}>{q.authorName}</Text>
              <Text style={styles.tweetTime}>{timeAgo(q.createdAt)}</Text>
              <View style={[styles.badge, q.status === 'RESOLVED' ? styles.badgeResolved : styles.badgeOpen]}>
                <Text style={[styles.badgeText, q.status === 'RESOLVED' ? styles.badgeTextR : styles.badgeTextO]}>
                  {q.status === 'RESOLVED' ? 'Resuelta' : 'Abierta'}
                </Text>
              </View>
            </View>
            <Text style={styles.tweetTitle}>{q.title}</Text>
            <Text style={styles.tweetContent} numberOfLines={isExpanded ? undefined : 3}>{q.body}</Text>
            <View style={styles.tweetActions}>
              <TouchableOpacity style={styles.voteBtn} onPress={() => voteQuestion(q.id)}>
                <Ionicons name={q.userVoted ? 'heart' : 'heart-outline'} size={14} color={q.userVoted ? '#D9B97E' : '#9CA3AF'} />
                <Text style={[styles.voteBtnText, q.userVoted && styles.voteBtnTextActive]}>{q.voteCount}</Text>
              </TouchableOpacity>
              <View style={styles.replyCount}>
                <Ionicons name="chatbubble-outline" size={13} color="#6B7280" />
                <Text style={styles.replyCountText}>{q.answerCount ?? 0}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Thread expanded */}
        {isExpanded && (
          <View style={styles.replies}>
            {loadingThread ? (
              <ActivityIndicator size="small" color="#D9B97E" style={{ margin: 12 }} />
            ) : (
              <>
                {threadAnswers.map((a, idx) => (
                  <View key={a.id} style={styles.reply}>
                    {idx < threadAnswers.length - 1 && <View style={styles.replyLine} />}
                    <View style={[styles.avatar, styles.avatarSmall]}>
                      <Text style={[styles.avatarText, styles.avatarTextSmall]}>{a.authorName?.[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                    <View style={styles.replyContent}>
                      {a.isAccepted && (
                        <View style={styles.acceptedTag}>
                          <Ionicons name="checkmark-circle" size={12} color="#34d399" />
                          <Text style={styles.acceptedText}>Respuesta aceptada</Text>
                        </View>
                      )}
                      <View style={styles.replyMeta}>
                        <Text style={styles.replyAuthor}>{a.authorName}</Text>
                        <Text style={styles.replyTime}>{timeAgo(a.createdAt)}</Text>
                      </View>
                      <Text style={styles.replyText}>{a.body}</Text>
                      <TouchableOpacity style={styles.voteBtn} onPress={() => voteAnswer(a.id)}>
                        <Ionicons name={a.userVoted ? 'heart' : 'heart-outline'} size={13} color={a.userVoted ? '#D9B97E' : '#9CA3AF'} />
                        <Text style={[styles.voteBtnText, a.userVoted && styles.voteBtnTextActive]}>{a.voteCount}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Reply input */}
                {canInteract ? (
                <View style={styles.replyInputRow}>
                  <View style={[styles.avatar, styles.avatarSmall]}>
                    <Text style={[styles.avatarText, styles.avatarTextSmall]}>
                      {authStore.user?.full_name?.[0]?.toUpperCase() ?? 'T'}
                    </Text>
                  </View>
                  <View style={styles.replyInputBox}>
                    <TextInput
                      style={styles.replyTextarea}
                      placeholder="Escribe tu respuesta..."
                      placeholderTextColor="#555"
                      value={replyBody}
                      onChangeText={setReplyBody}
                      multiline
                      maxLength={2000}
                    />
                    <TouchableOpacity
                      style={[styles.replySendBtn, (!replyBody.trim() || submittingReply) && styles.replySendBtnDisabled]}
                      onPress={() => submitReply(q.id)}
                      disabled={!replyBody.trim() || submittingReply}
                    >
                      {submittingReply
                        ? <ActivityIndicator size="small" color="#1a1a1a" />
                        : <>
                            <Ionicons name="send" size={13} color="#1a1a1a" />
                            <Text style={styles.replySendText}>Responder</Text>
                          </>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
                ) : (
                <Text style={styles.readOnlyMsg}>Solo lectura — no estás inscrito en esta materia</Text>
                )}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────────
  const selectedCourse = courses.find((c) => c.id_course === selectedId);
  const canInteract = selectedCourse?.isEnrolled ?? false;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={styles.pageTitleRow}>
          <Ionicons name="help-circle-outline" size={20} color="#D9B97E" />
          <Text style={styles.pageTitle}>Foro Académico</Text>
        </View>
        {canInteract && (
          <TouchableOpacity style={styles.newBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={16} color="#1a1a1a" />
            <Text style={styles.newBtnText}>Nueva</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtro desplegable */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Materia</Text>
        {loadingCourses ? (
          <ActivityIndicator size="small" color="#D9B97E" style={{ marginTop: 8 }} />
        ) : (
          <TouchableOpacity style={styles.selectBox} onPress={() => setShowCourseDropdown(true)} activeOpacity={0.8}>
            <Text style={styles.selectText} numberOfLines={1}>
              {selectedCourse?.name ?? 'Selecciona una materia'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
        {selectedCourse && (
          <View style={styles.selectedCourseRow}>
            <Text style={styles.qCount}>{questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'}</Text>
          </View>
        )}
      </View>

      {/* Dropdown modal */}
      <Modal visible={showCourseDropdown} transparent animationType="fade" onRequestClose={() => setShowCourseDropdown(false)}>
        <TouchableOpacity style={styles.dropdownBackdrop} activeOpacity={1} onPress={() => setShowCourseDropdown(false)}>
          <View style={styles.dropdownPanel}>
            <Text style={styles.dropdownTitle}>Selecciona una materia</Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {courses.map((c) => (
                <TouchableOpacity
                  key={c.id_course}
                  style={[styles.dropdownItem, selectedId === c.id_course && styles.dropdownItemActive]}
                  onPress={() => { setSelectedId(c.id_course); setShowCourseDropdown(false); }}
                >
                  <Text style={[styles.dropdownItemText, selectedId === c.id_course && styles.dropdownItemTextActive]} numberOfLines={2}>
                    {c.name}
                  </Text>
                  {selectedId === c.id_course && <Ionicons name="checkmark" size={16} color="#D9B97E" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Questions feed */}
      {loadingQ ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D9B97E" />
        </View>
      ) : questions.length === 0 && selectedId ? (
        <View style={styles.center}>
          <Ionicons name="help-circle-outline" size={44} color="#444" />
          <Text style={styles.emptyText}>Sé el primero en preguntar</Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          renderItem={renderQuestion}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.feed}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}

      <QuestionCreationModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateQuestion}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#1e1e1e' },

  pageHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageTitle:    { fontSize: 18, fontWeight: '800', color: '#f0f0f0' },

  newBtn:       { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#D9B97E', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  newBtnText:   { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },

  filterSection:     { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  filterLabel:       { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  selectBox:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#252525', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11 },
  selectText:        { flex: 1, fontSize: 14, fontWeight: '500', color: '#f0f0f0' },
  selectedCourseRow: { marginTop: 8 },
  qCount:            { fontSize: 12, color: '#6B7280' },

  dropdownBackdrop:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  dropdownPanel:         { backgroundColor: '#1a1a1a', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderWidth: 1, borderColor: 'rgba(217,185,126,0.2)', paddingBottom: 28, maxHeight: '60%' },
  dropdownTitle:         { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  dropdownItem:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  dropdownItemActive:    { backgroundColor: 'rgba(217,185,126,0.07)' },
  dropdownItemText:      { flex: 1, fontSize: 14, color: '#ccc' },
  dropdownItemTextActive:{ color: '#D9B97E', fontWeight: '600' },

  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText:  { fontSize: 14, color: '#555' },
  feed:       { paddingBottom: 20 },

  thread:        { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  threadExpanded:{ backgroundColor: 'rgba(217,185,126,0.03)' },

  tweet:    { flexDirection: 'row', gap: 10, padding: 14, position: 'relative' },
  threadLine: { position: 'absolute', left: 33, top: 62, bottom: -2, width: 2, backgroundColor: 'rgba(255,255,255,0.1)' },

  avatar:      { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(217,185,126,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarSmall: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)' },
  avatarText:  { fontSize: 15, fontWeight: '700', color: '#D9B97E' },
  avatarTextSmall: { fontSize: 12, color: '#9CA3AF' },

  tweetBody:   { flex: 1, minWidth: 0 },
  tweetMeta:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' },
  tweetAuthor: { fontSize: 14, fontWeight: '700', color: '#f0f0f0' },
  tweetTime:   { fontSize: 11, color: '#6B7280' },
  tweetTitle:  { fontSize: 15, fontWeight: '600', color: '#f0f0f0', lineHeight: 21, marginBottom: 4 },
  tweetContent:{ fontSize: 13, color: '#9CA3AF', lineHeight: 19, marginBottom: 8 },

  badge:         { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  badgeOpen:     { backgroundColor: 'rgba(217,185,126,0.15)', borderColor: 'rgba(217,185,126,0.3)' },
  badgeResolved: { backgroundColor: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.25)' },
  badgeText:     { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  badgeTextO:    { color: '#D9B97E' },
  badgeTextR:    { color: '#34d399' },

  tweetActions:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  voteBtn:       { flexDirection: 'row', alignItems: 'center', gap: 3, padding: 4 },
  voteBtnText:       { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  voteBtnTextActive: { color: '#D9B97E' },
  replyCount:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyCountText:{ fontSize: 13, color: '#6B7280' },

  replies:       { paddingLeft: 62, paddingRight: 14, paddingBottom: 12 },

  reply:         { flexDirection: 'row', gap: 8, paddingVertical: 10, position: 'relative' },
  replyLine:     { position: 'absolute', left: 14, top: 44, bottom: -4, width: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
  replyContent:  { flex: 1, minWidth: 0 },
  acceptedTag:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  acceptedText:  { fontSize: 11, fontWeight: '700', color: '#34d399' },
  replyMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  replyAuthor:   { fontSize: 13, fontWeight: '700', color: '#e0e0e0' },
  replyTime:     { fontSize: 11, color: '#6B7280' },
  replyText:     { fontSize: 14, color: '#ccc', lineHeight: 20, marginBottom: 6 },

  replyInputRow: { flexDirection: 'row', gap: 8, paddingTop: 10, alignItems: 'flex-start' },
  replyInputBox: { flex: 1, gap: 6 },
  replyTextarea: { backgroundColor: '#252525', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14, minHeight: 70, textAlignVertical: 'top' },
  replySendBtn:  { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#D9B97E', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  replySendBtnDisabled: { opacity: 0.4 },
  replySendText: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  readOnlyMsg: { fontSize: 12, color: '#555', fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
});
