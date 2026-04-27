/**
 * Tipos para la funcionalidad de upload de archivos
 */

export interface FileUploadResponse {
  message: string;
  data: FileData[];
}

export interface FileData {
  id_file: number;
  url: string;
  file_name: string;
  mime_type: string;
  size: number;
  created_at: string;
  id_message?: number;
  id_group: number;
}

/** Asset del picker con al menos uri, name y mimeType */
export interface PickerFileAsset {
  uri: string;
  name: string;
  mimeType?: string;
  type?: string;
  fileName?: string;
  size?: number;
}

export interface FileUploadParams {
  files: PickerFileAsset | PickerFileAsset[];
  id_group: string | number;
  id_message?: string | number;
}

export interface FileUploadError {
  status: number;
  message: string;
  details?: unknown;
}
