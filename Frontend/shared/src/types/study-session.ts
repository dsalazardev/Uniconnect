export interface StudySessionInstance {
  id_instance: number;
  id_session: number;
  title: string;
  description: string | null;
  scheduled_date: string;
  duration_minutes: number;
  is_recurring: boolean;
  status: 'ACTIVE' | 'CANCELLED';
  created_by: number;
  attendance_count: number;
  my_attendance: 'CONFIRMED' | 'DECLINED' | 'PENDING' | null;
}

export interface CreateStudySessionDto {
  title: string;
  description?: string;
  startDatetime: string;
  durationMinutes: number;
  recurrenceType: 'NONE' | 'WEEKLY';
  recurrenceEndDate?: string;
}
