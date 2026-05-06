import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { filesService } from '../services/files.service';

interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  /** Solo en web: objeto File nativo del navegador */
  file?: File;
}

interface FilePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onFilesSelected: (files: SelectedFile[]) => void;
  loading?: boolean;
}

export const FilePickerModal: React.FC<FilePickerModalProps> = ({
  visible,
  onClose,
  onFilesSelected,
  loading = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);

  const handlePickImages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galeria para seleccionar fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const files: SelectedFile[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `imagen_${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
          isImage: true,
          file: (asset as any).file ?? undefined,
        }));

        const allFiles = [...selectedFiles, ...files];
        const validation = filesService.validateFiles(allFiles);
        if (!validation.valid) {
          Alert.alert('Error', validation.error);
          return;
        }

        setSelectedFiles(allFiles);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Error al seleccionar imagenes');
      console.error(error);
    }
  };

  const handlePickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
      });

      if (!result.canceled) {
        const files: SelectedFile[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
          isImage: (asset.mimeType || '').startsWith('image/'),
          // En web, expo-document-picker expone el File nativo — lo preservamos
          file: (asset as any).file ?? undefined,
        }));

        const allFiles = [...selectedFiles, ...files];
        const validation = filesService.validateFiles(allFiles);
        if (!validation.valid) {
          Alert.alert('Error', validation.error);
          return;
        }

        setSelectedFiles(allFiles);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Error al seleccionar documentos');
      console.error(error);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if (selectedFiles.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un archivo');
      return;
    }

    onFilesSelected(selectedFiles);
    setSelectedFiles([]);
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Adjuntar archivos</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons name="close" size={24} color="#D9B97E" />
          </TouchableOpacity>
        </View>

        {/* Botones de seleccion */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePickImages}
            disabled={loading}
          >
            <Ionicons name="images-outline" size={24} color="#D9B97E" />
            <Text style={styles.actionButtonText}>Fotos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePickDocuments}
            disabled={loading}
          >
            <Ionicons name="document-outline" size={24} color="#D9B97E" />
            <Text style={styles.actionButtonText}>Documentos</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de archivos seleccionados */}
        <ScrollView style={styles.filesList}>
          {selectedFiles.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-upload-outline" size={48} color="#6B7280" />
              <Text style={styles.emptyText}>No hay archivos seleccionados</Text>
            </View>
          ) : (
            <View>
              {selectedFiles.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  {file.isImage ? (
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.fileThumbnail}
                    />
                  ) : (
                    <View style={styles.fileIconContainer}>
                      <Ionicons
                        name={filesService.getFileIcon(file.name) as any}
                        size={24}
                        color="#D9B97E"
                      />
                    </View>
                  )}
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.fileSize}>
                      {file.size ? filesService.getFileSize(file.size) : 'N/A'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveFile(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer con botones */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendButton, (loading || selectedFiles.length === 0) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={selectedFiles.length === 0 || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#1a1a1a" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#1a1a1a" />
                <Text style={styles.sendButtonText}>Enviar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D9B97E',
  },
  filesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fileThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  fileIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#363636',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  removeButton: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  sendButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    backgroundColor: '#D9B97E',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
});
