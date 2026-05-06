// Course types

export interface Course {
  id_course: number;
  name: string;
  code?: string;
  state?: string;
  id_program?: number;
  program?: {
    id_program: number;
    name: string;
  };
}

export interface CreateCourseDto {
  name: string;
  code?: string;
  id_program: number;
}

export interface UpdateCourseDto {
  name?: string;
  code?: string;
}
