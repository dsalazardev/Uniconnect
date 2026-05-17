import { z } from 'zod';
import { createFENResponseSchema } from './fen.validator';

export const ForumQuestionStatusSchema = z.enum(['OPEN', 'RESOLVED']);
export const ForumVoteEntityTypeSchema = z.enum(['QUESTION', 'ANSWER']);

export const ForumQuestionSchema = z.object({
  id: z.number().int().positive(),
  courseId: z.number().int().positive(),
  authorId: z.number().int().positive().nullable(),
  authorName: z.string(),
  title: z.string(),
  body: z.string(),
  status: ForumQuestionStatusSchema,
  voteCount: z.number().int().min(0),
  answerCount: z.number().int().min(0),
  createdAt: z.string().datetime(),
  userVoted: z.boolean().optional(),
});

export const ForumQuestionArraySchema = z.array(ForumQuestionSchema);
export const ForumQuestionFENResponseSchema = createFENResponseSchema(ForumQuestionSchema);
export const ForumQuestionArrayFENResponseSchema = createFENResponseSchema(ForumQuestionArraySchema);

export const ForumAnswerSchema = z.object({
  id: z.number().int().positive(),
  questionId: z.number().int().positive(),
  authorId: z.number().int().positive().nullable(),
  authorName: z.string(),
  body: z.string(),
  voteCount: z.number().int().min(0),
  isAccepted: z.boolean(),
  createdAt: z.string().datetime(),
  userVoted: z.boolean().optional(),
});

export const ForumAnswerArraySchema = z.array(ForumAnswerSchema);
export const ForumAnswerFENResponseSchema = createFENResponseSchema(ForumAnswerSchema);
export const ForumAnswerArrayFENResponseSchema = createFENResponseSchema(ForumAnswerArraySchema);

export const CreateQuestionDtoSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().min(1).max(2000),
});

export const CreateAnswerDtoSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const ForumVoteDtoSchema = z.object({
  entityType: ForumVoteEntityTypeSchema,
  entityId: z.number().int().positive(),
});

export type ForumQuestion = z.infer<typeof ForumQuestionSchema>;
export type ForumAnswer = z.infer<typeof ForumAnswerSchema>;
export type ForumQuestionStatus = z.infer<typeof ForumQuestionStatusSchema>;
export type ForumVoteEntityType = z.infer<typeof ForumVoteEntityTypeSchema>;
export type CreateQuestionDto = z.infer<typeof CreateQuestionDtoSchema>;
export type CreateAnswerDto = z.infer<typeof CreateAnswerDtoSchema>;
