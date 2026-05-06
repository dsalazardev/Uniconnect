/**
 * Servicio para gestionar uploads de archivos
 * Usa fetch nativo para evitar el bug de Axios con FormData en Android.
 * Endpoint: POST {API_BASE_URL}/files/upload
 */

import { API_BASE_URL } from '../constants/api';
import { authStore } from '../features/auth/store/AuthStore';
import { FileUploadParams, FileUploadResponse, FileUploadError } from '../types/files';

/**
 * Sube archivos al servidor usando fetch nativo.
 * Los archivos deben ser assets de expo-document-picker con { uri, name, mimeType }.
 */
export const uploadFiles = async (
  params: FileUploadParams
): Promise<FileUploadResponse> => {
  const token = authStore.accessToken;
  if (!token) {
    throw { status: 401, message: 'No authentication token found' } as FileUploadError;
  }

  const formData = new FormData();

  // Campos de texto
  formData.append('id_group', String(params.id_group));
  if (params.id_message !== undefined) {
    formData.append('id_message', String(params.id_message));
  }

  // Archivos en formato React Native: { uri, type, name }
  const filesToUpload = Array.isArray(params.files) ? params.files : [params.files];
  filesToUpload.forEach((file: any, index: number) => {
    formData.append('files', {
      uri: file.uri,
      type: file.mimeType || file.type || 'application/octet-stream',
      name: file.name || file.fileName || `archivo_${index}`,
    } as any);
  });

  try {
    // FETCH NATIVO: evita el bug de Axios con FormData en React Native Android
    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        // NO poner Content-Type: fetch calcula el boundary automaticamente
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Error del servidor: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw {
        status: response.status,
        message: errorMessage,
        details: errorText,
      } as FileUploadError;
    }

    const responseData: FileUploadResponse = await response.json();
    return responseData;
  } catch (error) {
    if ((error as FileUploadError).status) {
      throw error;
    }
    throw {
      status: 500,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    } as FileUploadError;
  }
};
