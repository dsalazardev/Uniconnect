/**
 * FilesService - Shared platform-agnostic file service
 *
 * Provides file validation, size formatting, and presigned URL retrieval.
 * Uses dependency injection for Axios instance.
 * Platform-specific methods (uploadFiles, downloadAndOpenFile) stay per-platform.
 */

import type { AxiosInstance } from 'axios';
import type { FENResponse } from '../types/common';
import { FILES_ENDPOINTS } from '../api/endpoints';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export class FilesService {
  private readonly api: AxiosInstance;

  static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;
  static readonly MAX_FILES = 5;

  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  static validateFiles(files: unknown[]): FileValidationResult {
    if (files.length === 0) {
      return { valid: false, error: 'Selecciona al menos un archivo' };
    }

    if (files.length > FilesService.MAX_FILES) {
      return { valid: false, error: `Maximo ${FilesService.MAX_FILES} archivos permitidos` };
    }

    for (const file of files) {
      const fileRecord = file as Record<string, unknown>;
      const size = (fileRecord.size ?? fileRecord.fileSize) as number | undefined;
      if (size && size > FilesService.MAX_FILE_SIZE) {
        return { valid: false, error: `${fileRecord.name} es muy grande (max 10MB)` };
      }
    }

    return { valid: true };
  }

  static getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  async getPresignedDownloadUrl(fileId: number): Promise<string> {
    try {
      const response = await this.api.get<FENResponse<{ url: string }>>(
        FILES_ENDPOINTS.GET_DOWNLOAD_URL(fileId)
      );

      const signedUrl = response.data?.data?.url;

      if (!signedUrl) {
        throw new Error('URL prefirmada no encontrada en la respuesta');
      }

      return signedUrl;
    } catch (error: unknown) {
      const errorObj = error as { message?: string };
      console.error('[FilesService] Error obteniendo URL prefirmada:', errorObj.message);
      throw error;
    }
  }
}
