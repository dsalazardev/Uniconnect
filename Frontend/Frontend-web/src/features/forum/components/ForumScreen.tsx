import React, { useState } from 'react';
import { MessageSquare, ChevronUp, Plus, AlertCircle } from 'lucide-react';
import type { ForumQuestion, ForumService } from '@uniconnect/shared';
import { useForum } from '../hooks/useForum';
import { QuestionCreationModal } from './QuestionCreationModal';
import { QuestionDetail } from './QuestionDetail';
import styles from './ForumScreen.module.css';

interface ForumScreenProps {
  subjectId: number;
  currentUserId: number;
  isTeacher: boolean;
  forumService: ForumService;
  socket?: any;
}

export const ForumScreen: React.FC<ForumScreenProps> = ({
  subjectId,
  currentUserId,
  isTeacher,
  forumService,
  socket,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ForumQuestion | null>(null);

  const { questions, loading, error, createQuestion, createAnswer, castVoteQuestion, sortAnswers } = useForum({
    subjectId,
    currentUserId,
    forumService,
    socket,
  });

  if (loading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <span className={styles.loadingText}>Cargando foro...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.center}>
        <AlertCircle size={40} color="#EF4444" />
        <span className={styles.errorText}>{error}</span>
      </div>
    );
  }

  if (selectedQuestion) {
    return (
      <QuestionDetail
        question={selectedQuestion}
        currentUserId={currentUserId}
        isTeacher={isTeacher}
        forumService={forumService}
        socket={socket}
        sortAnswers={sortAnswers}
        onBack={() => setSelectedQuestion(null)}
        onCreateAnswer={createAnswer}
      />
    );
  }

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <MessageSquare size={20} color="#D9B97E" />
          <h2 className={styles.title}>Foro de preguntas</h2>
          <span className={styles.count}>{questions.length}</span>
        </div>
        <button className={styles.newBtn} onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          Nueva pregunta
        </button>
      </div>

      {questions.length === 0 ? (
        <div className={styles.empty}>
          <MessageSquare size={40} color="#444" />
          <p>Aún no hay preguntas. ¡Sé el primero en preguntar!</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {questions.map((q) => (
            <li key={q.id} className={styles.item} onClick={() => setSelectedQuestion(q)}>
              <button
                className={styles.voteBtn}
                onClick={(e) => { e.stopPropagation(); castVoteQuestion(q.id); }}
                aria-label="Votar"
              >
                <ChevronUp size={16} />
                <span className={styles.voteCount}>{q.voteCount}</span>
              </button>

              <div className={styles.content}>
                <div className={styles.itemHeader}>
                  <span className={`${styles.badge} ${q.status === 'RESOLVED' ? styles.badgeResolved : styles.badgeOpen}`}>
                    {q.status === 'RESOLVED' ? 'RESUELTA' : 'ABIERTA'}
                  </span>
                  <span className={styles.answers}>
                    <MessageSquare size={12} />
                    {q.answerCount ?? 0} respuestas
                  </span>
                </div>
                <p className={styles.questionTitle}>{q.title}</p>
                <p className={styles.questionBody}>{q.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showCreateModal && (
        <QuestionCreationModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createQuestion}
        />
      )}
    </div>
  );
};
