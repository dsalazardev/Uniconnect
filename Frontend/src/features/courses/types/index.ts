export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  picture?: string;
  phone?: string;
  program?: string;
  current_semester?: number;
  progress?: number;
  roleName: string;
  courses: Course[];
}

export interface Course {
  id_course: number;
  name: string;
  state?: string;
}

export interface UpdateProfileData {
  phone?: string;
  current_semester?: number;
  image?: string;
}