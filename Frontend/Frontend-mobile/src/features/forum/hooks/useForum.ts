import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import type { ForumQuestion, ForumAnswer, CreateQuestionDto, CreateAnswerDto } from '@uniconnect/shared';
import { forumService } from '../services';

interface UseForumOptions {
  subjectId: number;
  socket?: any;
}

export const useForum = ({ subjectId, socket }: UseForumOptions) => {
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortQuestions = (qs: ForumQuestion[]) =>
    [...qs].sort((a, b) => b.voteCount - a.voteCount);

  const sortAnswers = useCallback((ans: ForumAnswer[]) =>
    [...ans].sort((a, b) => {
      if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
      return b.voteCount - a.voteCount;
    }), []);

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await forumService.getQuestions(subjectId);
      setQuestions(sortQuestions(data));
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar preguntas.');
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  // WebSocket: Observer pattern — sin polling
  useEffect(() => {
    if (!socket) return;

    const handleVoteUpdated = (payload: { entityType: string; entityId: number; voteCount: number }) => {
      if (payload.entityType === 'QUESTION') {
        setQuestions((prev) =>
          sortQuestions(
            prev.map((q) => q.id === payload.entityId ? { ...q, voteCount: payload.voteCount } : q)
          )
        );
      }
    };

    const handleAnswerAccepted = (payload: { questionId: number }) => {
      setQuestions((prev) =>
        prev.map((q) => q.id === payload.questionId ? { ...q, status: 'RESOLVED' as const } : q)
      );
    };

    socket.on('forum:vote_updated', handleVoteUpdated);
    socket.on('forum:answer_accepted', handleAnswerAccepted);
    return () => {
      socket.off('forum:vote_updated', handleVoteUpdated);
      socket.off('forum:answer_accepted', handleAnswerAccepted);
    };
  }, [socket]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const createQuestion = useCallback(async (dto: CreateQuestionDto): Promise<ForumQuestion> => {
    const created = await forumService.createQuestion(subjectId, dto);
    setQuestions((prev) => sortQuestions([created, ...prev]));
    return created;
  }, [subjectId]);

  const createAnswer = useCallback(async (questionId: number, dto: CreateAnswerDto): Promise<ForumAnswer> => {
    return forumService.createAnswer(questionId, dto);
  }, []);

  const castVoteQuestion = useCallback(async (questionId: number) => {
    setQuestions((prev) =>
      sortQuestions(prev.map((q) => q.id === questionId ? { ...q, voteCount: q.voteCount + 1 } : q))
    );
    try {
      const updated = await forumService.voteQuestion(questionId);
      setQuestions((prev) => sortQuestions(prev.map((q) => q.id === updated.id ? updated : q)));
    } catch (err: any) {
      setQuestions((prev) =>
        sortQuestions(prev.map((q) => q.id === questionId ? { ...q, voteCount: q.voteCount - 1 } : q))
      );
      Alert.alert('Foro', err?.response?.data?.message || 'No se pudo registrar el voto.');
    }
  }, []);

  return {
    questions,
    loading,
    error,
    createQuestion,
    createAnswer,
    castVoteQuestion,
    sortAnswers,
    reload: loadQuestions,
  };
};
