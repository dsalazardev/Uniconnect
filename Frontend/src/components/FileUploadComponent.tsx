/**
 * Componente UI para la subida de archivos
 * - Selecciona cualquier tipo de archivo
 * - Maneja estados: loading, error, success
 * - Muestra información de los archivos subidos
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { uploadFiles } from '../lib/fileService';
import { FileUploadResponse, FileData, FileUploadError } from '../types/files';

interface FileUploadComponentProps {
  id_group: string | number;
  id_message?: string | number;
  onSuccess?: (data: FileData[]) => void;
  onError?: (error: FileUploadError) => void;
}

export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  id_group,
  id_message,
  onSuccess,
  onError,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  /**
   * Abre el selector de documentos
   */
  const handleSelectFiles = async () => {
    try {
      setError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
      });

      if (!result.canceled) {
        setSelectedFiles(result.assets);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al seleccionar archivos';
      setError(errorMessage);
    }
  };

  /**
   * Realiza el upload de los archivos seleccionados
   */
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Por favor selecciona al menos un archivo');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setShowSuccess(false);

      // Pasar los assets directamente: uploadFiles ya maneja el formato RN {uri, type, name}
      const result = await uploadFiles({
        files: selectedFiles as any,
        id_group,
        id_message,
      });

      // Manejar respuesta exitosa
      setUploadedFiles(result.data);
      setShowSuccess(true);
      setSelectedFiles([]);

      // Callback de éxito
      if (onSuccess) {
        onSuccess(result.data);
      }

      // Mostrar mensaje de éxito
      Alert.alert('Éxito', `${result.data.length} archivo(s) subido(s) correctamente`);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as FileUploadError).message || 'Error al subir archivos';

      setError(errorMessage);

      // Callback de error
      if (onError) {
        onError(err as FileUploadError);
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Limpia los archivos seleccionados
   */
  const handleClearSelection = () => {
    setSelectedFiles([]);
    setError(null);
  };

  /**
   * Renderiza un archivo subido
   */
  const renderUploadedFile = ({ item }: { item: FileData }) => (
    <View style={styles.fileCard}>
      <Text style={styles.fileName}>{item.file_name}</Text>
      <Text style={styles.fileInfo}>Tamaño: {(item.size / 1024 / 1024).toFixed(2)} MB</Text>
      <Text style={styles.fileInfo}>Tipo: {item.mime_type}</Text>
      <Text style={styles.fileUrl} numberOfLines={1}>
        {item.url}
      </Text>
    </View>
  );

  /**
   * Renderiza un archivo seleccionado
   */
  const renderSelectedFile = ({ item }: { item: DocumentPicker.DocumentPickerAsset }) => (
    <View style={styles.selectedFileRow}>
      <Text style={styles.selectedFileName}>{item.name}</Text>
      <Text style={styles.selectedFileSize}>
        {item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Subir Archivos</Text>
      <Text style={styles.subtitle}>ID del Grupo: {id_group}</Text>

      {/* Selector de archivos */}
      <View style={styles.selectorSection}>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={handleSelectFiles}
          disabled={isLoading}
        >
          <Text style={styles.selectButtonText}>Seleccionar archivos</Text>
        </TouchableOpacity>

        {selectedFiles.length > 0 && (
          <Text style={styles.selectedCount}>{selectedFiles.length} archivo(s) seleccionado(s)</Text>
        )}
      </View>

      {/* Lista de archivos seleccionados */}
      {selectedFiles.length > 0 && (
        <View style={styles.selectedFilesSection}>
          <Text style={styles.sectionTitle}>Archivos Seleccionados:</Text>
          <FlatList
            data={selectedFiles}
            renderItem={renderSelectedFile}
            keyExtractor={(item, index) => `${index}-${item.name}`}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Botón de upload */}
      <TouchableOpacity
        style={[
          styles.uploadButton,
          (isLoading || selectedFiles.length === 0) && styles.uploadButtonDisabled,
        ]}
        onPress={handleUpload}
        disabled={isLoading || selectedFiles.length === 0}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Subir</Text>
        )}
      </TouchableOpacity>

      {/* Botón de limpiar selección */}
      {selectedFiles.length > 0 && !isLoading && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClearSelection}>
          <Text style={styles.clearButtonText}>Limpiar Selección</Text>
        </TouchableOpacity>
      )}

      {/* Archivos subidos exitosamente */}
      {showSuccess && uploadedFiles.length > 0 && (
        <View style={styles.uploadedSection}>
          <Text style={styles.sectionTitle}>✓ Archivos subidos correctamente:</Text>
          <FlatList
            data={uploadedFiles}
            renderItem={renderUploadedFile}
            keyExtractor={(item) => `${item.id_file}`}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  selectorSection: {
    marginBottom: 16,
  },
  selectButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  selectedCount: {
    marginTop: 8,
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '500',
  },
  selectedFilesSection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  selectedFileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedFileName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  selectedFileSize: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  uploadButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  uploadedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  fileCard: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  fileInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  fileUrl: {
    fontSize: 11,
    color: '#0891b2',
    marginTop: 4,
    fontFamily: 'monospace',
  },
});
