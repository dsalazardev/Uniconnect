export interface Course {
  id_course: number;
  name: string;
  state?: string;
}

export interface Enrollment {
  id_enrollment: number;
  course: Course;
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

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  picture?: string;
  phone?: string;
  program?: string;
  current_semester?: string;
  progress?: number;
  roleName: string;
  courses: Course[];
}
export interface OtherUserProfile {
  id: number;
  full_name: string;
  email: string;
  picture?: string;
  phone?: string;
  program?: string;
  current_semester?: string;
  roleName: string;
  connection_status: 'accepted' | 'connected' | 'pending_sent' | 'pending_received' | 'none';
  connection_id: number;
  common_courses: Course[];
}

export interface UpdateProfileData {
  phone?: string;
  current_semester?: string;
  image?: string;
}