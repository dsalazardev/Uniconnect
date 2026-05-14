export type ForumQuestionStatus = 'OPEN' | 'RESOLVED';
export type ForumVoteEntityType = 'QUESTION' | 'ANSWER';

export interface ForumQuestion {
  id: number;
  subjectId: number;
  authorId: number;
  authorName: string;
  title: string;
  body: string;
  status: ForumQuestionStatus;
  voteCount: number;
  answerCount: number;
  createdAt: string;
}

export interface ForumAnswer {
  id: number;
  questionId: number;
  authorId: number;
  authorName: string;
  body: string;
  voteCount: number;
  isAccepted: boolean;
  createdAt: string;
}

export interface CreateQuestionDto {
  title: string;
  body: string;
}

export interface CreateAnswerDto {
  body: string;
}

export interface ForumVoteDto {
  entityType: ForumVoteEntityType;
  entityId: number;
}
