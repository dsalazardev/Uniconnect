import type { AxiosInstance } from 'axios';
import type { ForumQuestion, ForumAnswer, CreateQuestionDto, CreateAnswerDto } from '../types/forum';
import { FORUM_ENDPOINTS } from '../api/endpoints/forum';

export class ForumService {
  constructor(private readonly api: AxiosInstance) {}

  async getQuestions(subjectId: number): Promise<ForumQuestion[]> {
    const response = await this.api.get(FORUM_ENDPOINTS.GET_QUESTIONS(subjectId));
    return response.data;
  }

  async createQuestion(subjectId: number, dto: CreateQuestionDto): Promise<ForumQuestion> {
    const response = await this.api.post(FORUM_ENDPOINTS.CREATE_QUESTION(subjectId), dto);
    return response.data;
  }

  async getAnswers(questionId: number): Promise<ForumAnswer[]> {
    const response = await this.api.get(FORUM_ENDPOINTS.GET_ANSWERS(questionId));
    return response.data;
  }

  async createAnswer(questionId: number, dto: CreateAnswerDto): Promise<ForumAnswer> {
    const response = await this.api.post(FORUM_ENDPOINTS.CREATE_ANSWER(questionId), dto);
    return response.data;
  }

  async voteQuestion(questionId: number): Promise<ForumQuestion> {
    const response = await this.api.post(FORUM_ENDPOINTS.VOTE_QUESTION(questionId));
    return response.data;
  }

  async voteAnswer(answerId: number): Promise<ForumAnswer> {
    const response = await this.api.post(FORUM_ENDPOINTS.VOTE_ANSWER(answerId));
    return response.data;
  }

  async acceptAnswer(answerId: number): Promise<ForumAnswer> {
    const response = await this.api.patch(FORUM_ENDPOINTS.ACCEPT_ANSWER(answerId));
    return response.data;
  }
}
