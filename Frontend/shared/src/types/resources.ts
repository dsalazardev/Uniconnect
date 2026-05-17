export type TipoContenido = 'ENLACE' | 'DOCUMENTO' | 'VIDEO' | 'IMAGEN' | 'ARTICULO' | 'OTRO';

export interface ResourceDecorators {
  titulo: string;
  url_externa: string | null;
  descripcion: string | null;
  imagen_preview: string | null;
  tipo_contenido: TipoContenido;
  creado_por: number;
  etiquetas?: string[];
  valoracion?: { promedio: number; total: number };
  comentarios?: { id_comment: number; contenido: string; usuario: string; fecha: string }[];
}

export interface Resource {
  id_resource: number;
  id_group: number;
  created_by: number;
  creator: { id_user: number; full_name: string; picture: string | null };
  url_externa: string | null;
  titulo: string;
  descripcion: string | null;
  imagen_preview: string | null;
  tipo_contenido: TipoContenido;
  created_at: string;
  updated_at: string;
  /** Metadata enriquecida por los decoradores activos */
  decoradores: ResourceDecorators;
}

export interface CreateResourcePayload {
  url_externa?: string;
  titulo?: string;
  descripcion?: string;
  tipo_contenido: TipoContenido;
  etiquetas?: string[];
}

export interface UpdateResourcePayload {
  titulo?: string;
  descripcion?: string;
  tipo_contenido?: TipoContenido;
  etiquetas?: string[];
}
