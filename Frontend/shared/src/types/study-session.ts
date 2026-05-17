import type {
  StudySessionInstance as ZodStudySessionInstance,
  CreateStudySessionDto as ZodCreateStudySessionDto,
  AttendanceStatus as ZodAttendanceStatus,
} from '../validators/study-sessions.validator';

export type AttendanceStatus = ZodAttendanceStatus;

export interface StudySessionInstance extends ZodStudySessionInstance {}
export interface CreateStudySessionDto extends ZodCreateStudySessionDto {}
