export const FORUM_ENDPOINTS = {
  GET_QUESTIONS:   (courseId: number) => `/courses/${courseId}/forum/questions`,
  CREATE_QUESTION: (courseId: number) => `/courses/${courseId}/forum/questions`,
  GET_ANSWERS:     (questionId: number) => `/forum/questions/${questionId}/answers`,
  CREATE_ANSWER:   (questionId: number) => `/forum/questions/${questionId}/answers`,
  VOTE_QUESTION:   (questionId: number) => `/forum/questions/${questionId}/vote`,
  VOTE_ANSWER:     (answerId: number)   => `/forum/answers/${answerId}/vote`,
  ACCEPT_ANSWER:   (answerId: number)   => `/forum/answers/${answerId}/accept`,
} as const;
