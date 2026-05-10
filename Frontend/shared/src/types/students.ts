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

// ─── Patrón Decorator US-D02 ──────────────────────────────────────────────────

export interface AsignaturaActiva {
  id_course: number;
  nombre: string;
}

export interface EstadisticasEstudiante {
  gruposCreados: number;
  gruposParticipa: number;
  mensajesEnviados: number;
}

export interface InsigniaEstudiante {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
}

/** Respuesta de GET /perfil/:id (solo perfil base, sin costo extra) */
export interface PerfilBase {
  id: number;
  nombre: string;
  carrera: string | null;
  semestre: number | null;
  asignaturasActivas: AsignaturaActiva[];
}

/** Respuesta de GET /perfil/:id?vista=completa (todos los decoradores aplicados) */
export interface PerfilCompleto extends PerfilBase {
  estadisticas: EstadisticasEstudiante;
  insignias: InsigniaEstudiante[];
}
