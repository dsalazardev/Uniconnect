import { api } from '@/constants/api';
import { FilesService as SharedFilesService } from '@uniconnect/shared';

export interface FileInfo {
  id_file: number;
  file_name: string;
  url: string;
  mime_type: string;
  size: number;
}

export class FilesService {
  private shared: SharedFilesService;

  constructor() {
    this.shared = new SharedFilesService(api);
  }

  validateFiles(files: unknown[]): { valid: boolean; error?: string } {
    return SharedFilesService.validateFiles(files);
  }

  getFileSize(bytes: number): string {
    return SharedFilesService.getFileSize(bytes);
  }

  async getPresignedDownloadUrl(fileId: number): Promise<string> {
    return this.shared.getPresignedDownloadUrl(fileId);
  }

  async downloadAndOpenFile(file: { id_file: number; file_name: string }): Promise<void> {
    try {
      const signedUrl = await this.shared.getPresignedDownloadUrl(file.id_file);

      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('[FilesService] Error downloading file:', error);
      throw new Error('No se pudo descargar el archivo');
    }
  }

  async uploadFiles(groupId: number, files: File[]): Promise<{ files: any[]; messageId: number }> {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('id_group', String(groupId));

      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('[FilesService] Error uploading files:', error);
      throw new Error('No se pudieron subir los archivos');
    }
  }
}

export const filesService = new FilesService();
