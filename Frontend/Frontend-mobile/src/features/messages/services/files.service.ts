import { Platform } from 'react-native';
import { FilesService as SharedFilesService } from '@uniconnect/shared';
import { api } from '@/src/constants/api';

class FilesService {
  private shared: SharedFilesService;

  constructor() {
    this.shared = new SharedFilesService(api);
  }

  async uploadFiles(
    files: any[],
    groupId: number,
    token: string,
    messageId?: number
  ): Promise<any[]> {
    const formData = new FormData();

    formData.append('id_group', String(groupId));
    if (messageId) {
      formData.append('id_message', String(messageId));
    }

    if (Platform.OS === 'web') {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];

        if (file.file instanceof File) {
          formData.append('files', file.file, file.name || file.file.name);
        } else if (file.uri && file.uri.startsWith('blob:')) {
          try {
            const blobResponse = await fetch(file.uri);
            const blob = await blobResponse.blob();
            const fileName = file.name || `archivo_${index}`;
            formData.append('files', blob, fileName);
          } catch {
            console.warn(`[FilesService] No se pudo convertir blob URI para ${file.name}`);
          }
        } else if (file.uri) {
          const blobResponse = await fetch(file.uri);
          const blob = await blobResponse.blob();
          formData.append('files', blob, file.name || `archivo_${index}`);
        }
      }
    } else {
      files.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          type: file.mimeType || file.type || 'application/octet-stream',
          name: file.name || file.fileName || `archivo_${index}`,
        } as any);
      });
    }

    try {
      const response = await fetch(`${api.defaults.baseURL}/files/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[FilesService] Error del servidor: ${response.status} - ${errorText}`);
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();

      return responseData.data || [];
    } catch (error: any) {
      console.error(`[FilesService] Error subiendo archivos:`, error.message);
      throw error;
    }
  }

  validateFiles(files: any[]): { valid: boolean; error?: string } {
    return SharedFilesService.validateFiles(files);
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image-outline';
    if (ext === 'pdf') return 'document-outline';
    if (['doc', 'docx'].includes(ext)) return 'document-text-outline';
    if (['xls', 'xlsx'].includes(ext)) return 'grid-outline';
    if (ext === 'txt') return 'document-outline';

    return 'attach-outline';
  }

  getFileSize(bytes: number): string {
    return SharedFilesService.getFileSize(bytes);
  }

  async getPresignedDownloadUrl(fileId: number, _token?: string): Promise<string> {
    return this.shared.getPresignedDownloadUrl(fileId);
  }

  async downloadAndOpenFile(file: { id_file: number; file_name: string }, token: string): Promise<void> {
    const { Alert } = await import('react-native');
    const WebBrowser = await import('expo-web-browser');

    try {
      const signedUrl = await this.getPresignedDownloadUrl(file.id_file, token);
      await WebBrowser.openBrowserAsync(signedUrl);
    } catch (error: any) {
      console.error(`[FilesService] Error descargando archivo:`, error.message);

      Alert.alert(
        'Error al descargar',
        `No se pudo abrir el archivo: ${error.message || 'Error desconocido'}`,
        [{ text: 'OK' }]
      );
    }
  }
}

export const filesService = new FilesService();
