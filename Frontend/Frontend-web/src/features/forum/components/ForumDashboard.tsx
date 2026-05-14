import React, { useEffect, useState, useCallback } from 'react';
import { ChevronUp, MessageSquare, Plus, Send, CheckCircle, X } from 'lucide-react';
import { authStore } from '@/features/auth/store/AuthStore';
import { forumService } from '@/features/messages/services';
import { websocketService } from '@/features/messages/services/websocket.service';
import type { ForumQuestion, ForumAnswer, CreateQuestionDto } from '@uniconnect/shared';
import { api } from '@/constants/api';
import styles from './ForumDashboard.module.css';

interface Course { id_course: number; name: string; code?: string; isEnrolled: boolean; }

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export const ForumDashboard: React.FC = () => {
  const currentUserId = authStore.user?.id_user ?? 0;
  const isTeacher = false;

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Thread state: which question is expanded, its answers
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [threadAnswers, setThreadAnswers] = useState<ForumAnswer[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // New question modal
  const [showNewQ, setShowNewQ] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);
  const [qError, setQError] = useState<string | null>(null);

  // ── Load courses from user's program ────────────────────────────────────────
  useEffect(() => {
    api.get('/courses/get-by-student')
      .then((r) => {
        const list: Course[] = Array.isArray(r.data) ? r.data : r.data?.courses ?? [];
        setCourses(list);
        if (list.length > 0) setSelectedCourseId(list[0].id_course);
      })
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, []);

  // ── Load questions when course changes ──────────────────────────────────────
  const loadQuestions = useCallback(async (courseId: number) => {
    setLoadingQuestions(true);
    setExpandedId(null);
    try {
      const data = await forumService.getQuestions(courseId);
      setQuestions([...data].sort((a, b) => b.voteCount - a.voteCount));
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    websocketService.emit('forum:join', { groupId: selectedCourseId });
    loadQuestions(selectedCourseId);
  }, [selectedCourseId, loadQuestions]);

  // ── WebSocket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    const onVote = (p: { entityType: string; entityId: number; voteCount: number }) => {
      if (p.entityType === 'QUESTION') {
        setQuestions((prev) =>
          [...prev.map((q) => q.id === p.entityId ? { ...q, voteCount: p.voteCount } : q)]
            .sort((a, b) => b.voteCount - a.voteCount)
        );
      } else {
        setThreadAnswers((prev) =>
          prev.map((a) => a.id === p.entityId ? { ...a, voteCount: p.voteCount } : a)
        );
      }
    };
    const onAccepted = (p: { questionId: number; answerId: number }) => {
      setQuestions((prev) =>
        prev.map((q) => q.id === p.questionId ? { ...q, status: 'RESOLVED' as const } : q)
      );
      setThreadAnswers((prev) =>
        prev.map((a) => ({ ...a, isAccepted: a.id === p.answerId }))
      );
    };
    websocketService.on('forum:vote_updated', onVote);
    websocketService.on('forum:answer_accepted', onAccepted);
    return () => {
      websocketService.off('forum:vote_updated', onVote);
      websocketService.off('forum:answer_accepted', onAccepted);
    };
  }, []);

  // ── Thread expand ────────────────────────────────────────────────────────────
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
    } finally {
      setLoadingThread(false);
    }
  };

  // ── Vote question ────────────────────────────────────────────────────────────
  const voteQuestion = async (qId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuestions((prev) =>
      [...prev.map((q) => q.id === qId ? { ...q, voteCount: q.voteCount + 1 } : q)]
        .sort((a, b) => b.voteCount - a.voteCount)
    );
    try { await forumService.voteQuestion(qId); }
    catch { setQuestions((prev) =>
      [...prev.map((q) => q.id === qId ? { ...q, voteCount: q.voteCount - 1 } : q)]
        .sort((a, b) => b.voteCount - a.voteCount)
    ); }
  };

  // ── Vote answer ──────────────────────────────────────────────────────────────
  const voteAnswer = async (aId: number) => {
    setThreadAnswers((prev) => prev.map((a) => a.id === aId ? { ...a, voteCount: a.voteCount + 1 } : a));
    try { await forumService.voteAnswer(aId); }
    catch { setThreadAnswers((prev) => prev.map((a) => a.id === aId ? { ...a, voteCount: a.voteCount - 1 } : a)); }
  };

  // ── Submit reply ─────────────────────────────────────────────────────────────
  const submitReply = async (questionId: number) => {
    if (!replyBody.trim() || submittingReply) return;
    setSubmittingReply(true);
    try {
      const created = await forumService.createAnswer(questionId, { body: replyBody.trim() });
      setThreadAnswers((prev) => [...prev, created]);
      setQuestions((prev) =>
        prev.map((q) => q.id === questionId ? { ...q, answerCount: (q.answerCount ?? 0) + 1 } : q)
      );
      setReplyBody('');
    } catch { /* keep input */ }
    finally { setSubmittingReply(false); }
  };

  // ── Accept answer ────────────────────────────────────────────────────────────
  const acceptAnswer = async (aId: number) => {
    try {
      await forumService.acceptAnswer(aId);
      setThreadAnswers((prev) => prev.map((a) => ({ ...a, isAccepted: a.id === aId })));
    } catch { /* forbidden */ }
  };

  // ── New question ─────────────────────────────────────────────────────────────
  const submitNewQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQError(null);
    if (!newTitle.trim()) { setQError('El título no puede estar vacío.'); return; }
    if (!newBody.trim())  { setQError('El cuerpo no puede estar vacío.'); return; }
    if (!selectedCourseId) return;
    setSubmittingQ(true);
    try {
      const created = await forumService.createQuestion(selectedCourseId, { title: newTitle.trim(), body: newBody.trim() });
      setQuestions((prev) => [created, ...prev]);
      setNewTitle(''); setNewBody(''); setShowNewQ(false);
    } catch (err: any) {
      setQError(err?.response?.data?.message || 'Error al publicar.');
    } finally { setSubmittingQ(false); }
  };

  const selectedCourse = courses.find((c) => c.id_course === selectedCourseId);
  const canInteract = selectedCourse?.isEnrolled ?? false;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Foro Académico</h1>
        <p className={styles.pageSubtitle}>Preguntas y respuestas por asignatura</p>
      </div>

      {/* ── Filtro desplegable de materias ──────────────────────────────────── */}
      <div className={styles.filterRow}>
        <span className={styles.filterLabel}>Materia</span>
        {loadingCourses ? (
          <span className={styles.filterLoading}>Cargando...</span>
        ) : (
          <select
            className={styles.filterSelect}
            value={selectedCourseId ?? ''}
            onChange={(e) => setSelectedCourseId(Number(e.target.value))}
          >
            {courses.length === 0 && (
              <option value="" disabled>Sin materias registradas</option>
            )}
            {courses.map((c) => (
              <option key={c.id_course} value={c.id_course}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Contenido del foro ─────────────────────────────────────────────── */}
      {selectedCourseId && (
        <div className={styles.forumSection}>

          {/* Sub-header de la materia seleccionada */}
          <div className={styles.forumHeader}>
            <div>
              <h2 className={styles.courseLabel}>{selectedCourse?.name}</h2>
              <span className={styles.questionCount}>{questions.length} preguntas</span>
            </div>
            {canInteract && (
              <button className={styles.newBtn} onClick={() => setShowNewQ(true)}>
                <Plus size={15} /> Nueva pregunta
              </button>
            )}
          </div>

          {/* Lista de preguntas + hilos */}
          {loadingQuestions ? (
            <div className={styles.centerMsg}>Cargando preguntas...</div>
          ) : questions.length === 0 ? (
            <div className={styles.centerMsg}>
              <MessageSquare size={36} color="#444" />
              <p>Sé el primero en preguntar en esta materia</p>
            </div>
          ) : (
            <div className={styles.feed}>
              {questions.map((q) => (
                <div key={q.id} className={styles.thread}>

                  {/* ── Pregunta principal ── */}
                  <div
                    className={`${styles.tweet} ${expandedId === q.id ? styles.tweetExpanded : ''}`}
                    onClick={() => toggleThread(q.id)}
                  >
                    {/* Línea vertical si expandido */}
                    {expandedId === q.id && <div className={styles.threadLine} />}

                    <div className={styles.tweetAvatar}>
                      {q.authorName?.[0]?.toUpperCase() ?? '?'}
                    </div>

                    <div className={styles.tweetBody}>
                      <div className={styles.tweetMeta}>
                        <span className={styles.tweetAuthor}>{q.authorName}</span>
                        <span className={styles.tweetTime}>{timeAgo(q.createdAt)}</span>
                        <span className={`${styles.badge} ${q.status === 'RESOLVED' ? styles.badgeResolved : styles.badgeOpen}`}>
                          {q.status === 'RESOLVED' ? 'Resuelta' : 'Abierta'}
                        </span>
                      </div>
                      <p className={styles.tweetTitle}>{q.title}</p>
                      <p className={styles.tweetContent}>{q.body}</p>
                      <div className={styles.tweetActions}>
                        <button
                          className={styles.voteBtn}
                          onClick={(e) => voteQuestion(q.id, e)}
                          title="Votar"
                        >
                          <ChevronUp size={14} /> {q.voteCount}
                        </button>
                        <span className={styles.replyCount}>
                          <MessageSquare size={13} /> {q.answerCount ?? 0} respuestas
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Hilo de respuestas (expandido) ── */}
                  {expandedId === q.id && (
                    <div className={styles.replies}>
                      {loadingThread ? (
                        <div className={styles.replyLoading}>Cargando respuestas...</div>
                      ) : (
                        <>
                          {threadAnswers.map((a, idx) => (
                            <div key={a.id} className={styles.reply}>
                              {/* Línea vertical conectora */}
                              {idx < threadAnswers.length - 1 && <div className={styles.replyLine} />}

                              <div className={styles.replyAvatar}>
                                {a.authorName?.[0]?.toUpperCase() ?? '?'}
                              </div>

                              <div className={styles.replyContent}>
                                {a.isAccepted && (
                                  <div className={styles.acceptedTag}>
                                    <CheckCircle size={12} /> Respuesta aceptada
                                  </div>
                                )}
                                <div className={styles.replyMeta}>
                                  <span className={styles.replyAuthor}>{a.authorName}</span>
                                  <span className={styles.replyTime}>{timeAgo(a.createdAt)}</span>
                                </div>
                                <p className={styles.replyText}>{a.body}</p>
                                <div className={styles.replyActions}>
                                  <button className={styles.voteBtn} onClick={() => voteAnswer(a.id)}>
                                    <ChevronUp size={13} /> {a.voteCount}
                                  </button>
                                  {isTeacher && !a.isAccepted && q.status === 'OPEN' && (
                                    <button className={styles.acceptBtn} onClick={() => acceptAnswer(a.id)}>
                                      <CheckCircle size={12} /> Aceptar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* ── Input de respuesta ── */}
                          {canInteract ? (
                          <div className={styles.replyInput}>
                            <div className={styles.replyAvatar}>
                              {authStore.user?.full_name?.[0]?.toUpperCase() ?? 'T'}
                            </div>
                            <div className={styles.replyInputBox}>
                              <textarea
                                className={styles.replyTextarea}
                                placeholder="Escribe tu respuesta..."
                                value={replyBody}
                                onChange={(e) => setReplyBody(e.target.value)}
                                rows={2}
                                maxLength={2000}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                className={styles.replySendBtn}
                                disabled={!replyBody.trim() || submittingReply}
                                onClick={(e) => { e.stopPropagation(); submitReply(q.id); }}
                              >
                                <Send size={14} />
                                {submittingReply ? 'Enviando...' : 'Responder'}
                              </button>
                            </div>
                          </div>
                          ) : (
                          <p className={styles.readOnlyMsg}>Solo lectura — no estás inscrito en esta materia</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal nueva pregunta ─────────────────────────────────────────────── */}
      {showNewQ && (
        <div className={styles.modalBackdrop} onClick={() => setShowNewQ(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Nueva pregunta</h3>
              <button className={styles.modalClose} onClick={() => setShowNewQ(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitNewQuestion} className={styles.modalForm}>
              <label className={styles.fieldLabel}>Título</label>
              <input
                className={styles.fieldInput}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="¿Cuál es tu pregunta?"
                maxLength={300}
                autoFocus
              />
              <label className={styles.fieldLabel}>Descripción</label>
              <textarea
                className={`${styles.fieldInput} ${styles.fieldTextarea}`}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Explica tu pregunta con más detalle..."
                maxLength={2000}
                rows={4}
              />
              {qError && <p className={styles.fieldError}>{qError}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowNewQ(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submittingQ}>
                  {submittingQ ? 'Publicando...' : 'Publicar pregunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
