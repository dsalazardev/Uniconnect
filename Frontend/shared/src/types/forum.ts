import type {
  ForumQuestion as ZodForumQuestion,
  ForumAnswer as ZodForumAnswer,
  ForumQuestionStatus as ZodForumQuestionStatus,
  ForumVoteEntityType as ZodForumVoteEntityType,
  CreateQuestionDto as ZodCreateQuestionDto,
  CreateAnswerDto as ZodCreateAnswerDto,
} from '../validators/forum.validator';

export type ForumQuestionStatus = ZodForumQuestionStatus;
export type ForumVoteEntityType = ZodForumVoteEntityType;

export interface ForumQuestion extends ZodForumQuestion {}
export interface ForumAnswer extends ZodForumAnswer {}
export interface CreateQuestionDto extends ZodCreateQuestionDto {}
export interface CreateAnswerDto extends ZodCreateAnswerDto {}

export interface ForumVoteDto {
  entityType: ForumVoteEntityType;
  entityId: number;
}
