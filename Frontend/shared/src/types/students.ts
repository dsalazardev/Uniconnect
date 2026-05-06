// Student types

export interface Enrollment {
  id_enrollment: number;
  course: {
    id_course: number;
    name: string;
    state?: string;
  };
}

export interface CommonCourse {
  id_course: number;
  name: string;
}

export interface Student {
  id_user: number;
  full_name: string;
  email: string;
  picture?: string;
  id_program?: number;
  current_semester?: number;
  program?: { name: string };
  enrollments: Enrollment[];
  common_courses?: CommonCourse[];
}

export interface StudentProfile {
  id: number;
  full_name: string;
  email: string;
  picture?: string;
  phone?: string;
  program?: string;
  current_semester?: string;
  progress?: number;
  roleName: string;
  courses: Array<{
    id_course: number;
    name: string;
    state?: string;
  }>;
  connection_status?: 'accepted' | 'connected' | 'pending_sent' | 'pending_received' | 'none';
  connection_id?: number;
  common_courses?: CommonCourse[];
}

export interface UpdateProfileData {
  phone?: string;
  current_semester?: string;
  image?: string;
}
