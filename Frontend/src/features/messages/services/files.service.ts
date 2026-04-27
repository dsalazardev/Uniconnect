import { API_BASE_URL } from '@/src/constants/api';

class FilesService {
  /**
   * Subir archivos a S3 a traves del backend.
   * Usa fetch nativo en lugar de Axios para evitar el bug de Network Error
   * con FormData en React Native Android.
   */
  async uploadFiles(
    files: any[],
    groupId: number,
    token: string,
    messageId?: number
  ): Promise<any[]> {
    const formData = new FormData();

    // Campos de texto primero
    formData.append('id_group', String(groupId));
    if (messageId) {
      formData.append('id_message', String(messageId));
    }

    // Archivos en formato React Native: { uri, type, name }
    files.forEach((file, index) => {
      formData.append('files', {
        uri: file.uri,
        type: file.mimeType || file.type || 'application/octet-stream',
        name: file.name || file.fileName || `archivo_${index}`,
      } as any);
    });

    console.log(`[FilesService] Subiendo ${files.length} archivo(s) al grupo ${groupId}...`);

    try {
      // FETCH NATIVO: evita el bug de Axios con FormData en Android
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
        console.error(`[FilesService] Error del servidor: ${response.status} - ${errorText}`);
        throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`[FilesService] Archivos subidos exitosamente`);
      return responseData.data || [];
    } catch (error: any) {
      console.error(`[FilesService] Error subiendo archivos:`, error.message);
      throw error;
    }
  }

  /**
   * Validar que los archivos cumplan con los requisitos basicos
   * Solo valida cantidad y tamano, NO tipo MIME (S3 acepta todo)
   */
  validateFiles(files: any[]): { valid: boolean; error?: string } {
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_FILES = 5;

    if (files.length === 0) {
      return { valid: false, error: 'Selecciona al menos un archivo' };
    }

    if (files.length > MAX_FILES) {
      return { valid: false, error: `Maximo ${MAX_FILES} archivos permitidos` };
    }

    for (const file of files) {
      const size = file.size || file.fileSize;
      if (size && size > MAX_FILE_SIZE) {
        return { valid: false, error: `${file.name} es muy grande (max 10MB)` };
      }
    }

    return { valid: true };
  }

  /**
   * Obtener el icono para un tipo de archivo
   */
  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image-outline';
    if (ext === 'pdf') return 'document-outline';
    if (['doc', 'docx'].includes(ext)) return 'document-text-outline';
    if (['xls', 'xlsx'].includes(ext)) return 'grid-outline';
    if (ext === 'txt') return 'document-outline';

    return 'attach-outline';
  }

  /**
   * Obtener tamano legible del archivo
   */
  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

    /**
     * Obtener URL prefirmada para descargar un archivo de forma segura desde S3
     * @param fileId - ID del archivo en la base de datos
     * @param token - Token JWT del usuario autenticado
     * @returns URL prefirmada válida por 1 hora
     */
    async getPresignedDownloadUrl(fileId: number, token: string): Promise<string> {
      try {
        console.log(`[FilesService] Solicitando URL prefirmada para archivo ${fileId}...`);

        const response = await fetch(`${API_BASE_URL}/files/${fileId}/download`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[FilesService] Error obteniendo URL prefirmada: ${response.status} - ${errorText}`);
          throw new Error(`Error del servidor: ${response.status}`);
        }

        const responseData = await response.json();

        // Desempaquetar respuesta FEN estándar: response.data.data.url
        const signedUrl = responseData?.data?.url;

        if (!signedUrl) {
          throw new Error('URL prefirmada no encontrada en la respuesta');
        }

        console.log(`[FilesService] URL prefirmada obtenida exitosamente`);
        return signedUrl;
      } catch (error: any) {
        console.error(`[FilesService] Error obteniendo URL prefirmada:`, error.message);
        throw error;
      }
    }

    /**
     * Descargar y abrir un archivo usando Presigned URL
     * Orquesta todo el flujo: obtener URL prefirmada -> abrir en navegador
     * @param file - Objeto completo del archivo con id_file
     * @param token - Token JWT del usuario autenticado
     */
    async downloadAndOpenFile(file: { id_file: number; file_name: string }, token: string): Promise<void> {
      const { Alert } = await import('react-native');
      const WebBrowser = await import('expo-web-browser');

      try {
        console.log(`[FilesService] Iniciando descarga de archivo: ${file.file_name}`);

        // Obtener URL prefirmada del backend
        const signedUrl = await this.getPresignedDownloadUrl(file.id_file, token);

        console.log(`[FilesService] Abriendo archivo en navegador...`);

        // Abrir el archivo usando Expo WebBrowser
        await WebBrowser.openBrowserAsync(signedUrl);

        console.log(`[FilesService] Archivo abierto exitosamente`);
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
