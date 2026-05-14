import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronUp, CheckCircle, Send } from 'lucide-react';
import type { ForumQuestion, ForumAnswer, ForumService } from '@uniconnect/shared';
import styles from './QuestionDetail.module.css';

interface QuestionDetailProps {
  question: ForumQuestion;
  currentUserId: number;
  isTeacher: boolean;
  forumService: ForumService;
  socket?: any;
  sortAnswers: (answers: ForumAnswer[]) => ForumAnswer[];
  onBack: () => void;
  onCreateAnswer: (questionId: number, dto: { body: string }) => Promise<ForumAnswer>;
}

export const QuestionDetail: React.FC<QuestionDetailProps> = ({
  question,
  currentUserId,
  isTeacher,
  forumService,
  socket,
  sortAnswers,
  onBack,
  onCreateAnswer,
}) => {
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
  }, [question.id, forumService, sortAnswers]);

  // WebSocket: actualizar votos y respuesta aceptada en tiempo real
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

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className={styles.container}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={18} />
          Volver al foro
        </button>
        <span className={`${styles.badge} ${question.status === 'RESOLVED' ? styles.badgeResolved : styles.badgeOpen}`}>
          {question.status === 'RESOLVED' ? 'RESUELTA' : 'ABIERTA'}
        </span>
      </div>

      {/* Pregunta */}
      <div className={styles.questionCard}>
        <h2 className={styles.questionTitle}>{question.title}</h2>
        <p className={styles.questionBody}>{question.body}</p>
        <span className={styles.meta}>Por · ID {question.authorId}</span>
      </div>

      {/* Respuestas */}
      <div className={styles.answersSection}>
        <h3 className={styles.sectionTitle}>
          {answers.length} {answers.length === 1 ? 'respuesta' : 'respuestas'}
        </h3>

        {loadingAnswers ? (
          <div className={styles.loadingAnswers}>Cargando respuestas...</div>
        ) : (
          <ul className={styles.answerList}>
            {answers.map((answer) => (
              <li key={answer.id} className={`${styles.answerItem} ${answer.isAccepted ? styles.answerAccepted : ''}`}>

                {answer.isAccepted && (
                  <div className={styles.acceptedBadge}>
                    <CheckCircle size={14} />
                    Respuesta aceptada
                  </div>
                )}

                <div className={styles.answerContent}>
                  <button
                    className={styles.voteBtn}
                    onClick={() => handleVoteAnswer(answer.id)}
                    aria-label="Votar respuesta"
                  >
                    <ChevronUp size={15} />
                    <span>{answer.voteCount}</span>
                  </button>

                  <div className={styles.answerBody}>
                    <p>{answer.body}</p>
                    <span className={styles.meta}>Por · ID {answer.authorId}</span>
                  </div>

                  {isTeacher && !answer.isAccepted && question.status === 'OPEN' && (
                    <button
                      className={styles.acceptBtn}
                      onClick={() => handleAcceptAnswer(answer.id)}
                    >
                      <CheckCircle size={14} />
                      Aceptar
                    </button>
                  )}
                </div>

              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Caja de respuesta */}
      <form className={styles.replyBox} onSubmit={handleSubmitAnswer}>
        <textarea
          className={styles.replyInput}
          placeholder="Escribe tu respuesta..."
          value={answerBody}
          onChange={(e) => setAnswerBody(e.target.value)}
          maxLength={2000}
          rows={3}
        />
        <button
          type="submit"
          className={styles.replyBtn}
          disabled={!answerBody.trim() || submitting}
        >
          <Send size={15} />
          {submitting ? 'Publicando...' : 'Responder'}
        </button>
      </form>

    </div>
  );
};
