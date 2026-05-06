// Re-export types from shared package
export type {
  Enrollment,
  CommonCourse,
  Student,
  StudentProfile,
  UpdateProfileData,
} from '@uniconnect/shared';

// UserProfile is in users types
export type { UserProfile } from '@uniconnect/shared';

// OtherUserProfile is an alias for StudentProfile
export type { StudentProfile as OtherUserProfile } from '@uniconnect/shared';

// Course type for compatibility
export type Course = {
  id_course: number;
  name: string;
  state?: string;
};
