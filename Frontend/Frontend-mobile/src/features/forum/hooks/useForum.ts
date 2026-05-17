import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import type { ForumQuestion, ForumAnswer, CreateQuestionDto, CreateAnswerDto } from '@uniconnect/shared';
import { forumService } from '../services';
import { websocketService } from '@/src/features/messages/services/websocket.service';

export const useForum = (courseId: number) => {
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
      const data = await forumService.getQuestions(courseId);
      setQuestions(sortQuestions(data));
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar preguntas.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    websocketService.emit('forum:join', { groupId: courseId });

    const handleVoteUpdated = (payload: { entityType: string; entityId: number; voteCount: number }) => {
      if (payload.entityType === 'QUESTION') {
        setQuestions((prev) =>
          sortQuestions(prev.map((q) =>
            q.id === payload.entityId ? { ...q, voteCount: payload.voteCount } : q
          ))
        );
      }
    };
    const handleAnswerAccepted = (payload: { questionId: number }) => {
      setQuestions((prev) =>
        prev.map((q) => q.id === payload.questionId ? { ...q, status: 'RESOLVED' as const } : q)
      );
    };

    websocketService.on('forum:vote_updated', handleVoteUpdated);
    websocketService.on('forum:answer_accepted', handleAnswerAccepted);
    return () => {
      websocketService.off('forum:vote_updated', handleVoteUpdated);
      websocketService.off('forum:answer_accepted', handleAnswerAccepted);
    };
  }, [courseId]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const createQuestion = useCallback(async (dto: CreateQuestionDto): Promise<ForumQuestion> => {
    const created = await forumService.createQuestion(courseId, dto);
    setQuestions((prev) => sortQuestions([created, ...prev]));
    return created;
  }, [courseId]);

  const createAnswer = useCallback(async (questionId: number, dto: CreateAnswerDto): Promise<ForumAnswer> =>
    forumService.createAnswer(questionId, dto), []);

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

  return { questions, loading, error, createQuestion, createAnswer, castVoteQuestion, sortAnswers, reload: loadQuestions };
};
