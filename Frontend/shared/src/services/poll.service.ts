import type { AxiosInstance } from 'axios';
import type { Poll, CreatePollDto, CastVoteDto } from '../types/polls';
import { POLLS_ENDPOINTS } from '../api/endpoints/polls';

/**
 * PollService - BFF layer for poll operations.
 * Single service consumed by both web and mobile dashboards.
 */
export class PollService {
  constructor(private readonly api: AxiosInstance) {}

  async createPoll(groupId: number, payload: CreatePollDto): Promise<Poll> {
    try {
      const response = await this.api.post(POLLS_ENDPOINTS.CREATE_POLL(groupId), payload);
      return response.data;
    } catch (error) {
      console.error('[PollService] Error al crear encuesta:', error);
      throw error;
    }
  }

  async castVote(pollId: number, optionId: number): Promise<Poll> {
    try {
      const dto: CastVoteDto = { optionId };
      const response = await this.api.post(POLLS_ENDPOINTS.CAST_VOTE(pollId), dto);
      return response.data;
    } catch (error) {
      console.error('[PollService] Error al registrar voto:', error);
      throw error;
    }
  }

  async getPoll(pollId: number): Promise<Poll> {
    try {
      const response = await this.api.get(POLLS_ENDPOINTS.GET_POLL(pollId));
      return response.data;
    } catch (error) {
      console.error('[PollService] Error al obtener encuesta:', error);
      throw error;
    }
  }
}
