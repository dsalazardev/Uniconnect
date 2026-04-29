import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageFile } from '../../types';

interface WithFileAttachmentProps {
  files: MessageFile[];
  onFilePress?: (file: { id_file: number; file_name: string }) => void;
  children: React.ReactNode;
}

/**
 * Decorador de archivos adjuntos (Patrón Decorator).
 * Envuelve cualquier contenido base y añade la visualización de archivos
 * si el mensaje los tiene. Diferencia imágenes de documentos.
 */
export const WithFileAttachment: React.FC<WithFileAttachmentProps> = ({
  files,
  onFilePress,
  children,
}) => {
  if (!files || files.length === 0) {
    return <>{children}</>;
  }

  return (
    <View>
      {children}
      <View style={styles.filesContainer}>
        {files.map((file) => (
          <FileItem key={`file-${file.id_file}`} file={file} onFilePress={onFilePress} />
        ))}
      </View>
    </View>
  );
};

// ── Sub-componente por tipo de archivo ─────────────────────────────────────

const FileItem: React.FC<{
  file: MessageFile;
  onFilePress?: (file: { id_file: number; file_name: string }) => void;
}> = ({ file, onFilePress }) => {
  const mime = file.mime_type ?? '';
  const isImage = mime.startsWith('image/');
  const isPdf = mime === 'application/pdf';
  const isVideo = mime.startsWith('video/');

  const handlePress = () => onFilePress?.({ id_file: file.id_file, file_name: file.file_name });

  if (isImage) {
    return (
      <View style={styles.imageWrapper}>
        <Image source={{ uri: file.url }} style={styles.image} resizeMode="cover" />
        <TouchableOpacity style={styles.imageOverlay} onPress={handlePress} activeOpacity={0.6}>
          <Ionicons name="arrow-down-circle" size={56} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      </View>
    );
  }

  // Elige icono y color según tipo
  const { iconName, iconColor } = getFileIcon(mime, isPdf, isVideo);

  return (
    <TouchableOpacity style={styles.docRow} onPress={handlePress} activeOpacity={0.7}>
      <View style={[styles.docIconBox, { backgroundColor: iconColor }]}>
        <Ionicons name={iconName as any} size={28} color="#fff" />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docName} numberOfLines={1}>
          {file.file_name || 'Archivo adjunto'}
        </Text>
        <Text style={styles.docSize}>
          {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '—'}
        </Text>
      </View>
      <Ionicons name="download-outline" size={24} color="#54656f" />
    </TouchableOpacity>
  );
};

function getFileIcon(
  mime: string,
  isPdf: boolean,
  isVideo: boolean,
): { iconName: string; iconColor: string } {
  if (isPdf) return { iconName: 'document-text', iconColor: '#FF5722' };
  if (isVideo) return { iconName: 'videocam', iconColor: '#7C3AED' };
  if (mime.includes('word') || mime.includes('document'))
    return { iconName: 'document', iconColor: '#2563EB' };
  if (mime.includes('sheet') || mime.includes('excel'))
    return { iconName: 'grid', iconColor: '#16A34A' };
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('compressed'))
    return { iconName: 'archive', iconColor: '#D97706' };
  return { iconName: 'attach', iconColor: '#6B7280' };
}

const styles = StyleSheet.create({
  filesContainer: {
    marginTop: 6,
    gap: 8,
  },
  imageWrapper: {
    position: 'relative',
    width: 240,
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#d9d9d9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 12,
    padding: 12,
    width: 280,
    borderWidth: 1,
    borderColor: '#e1e5e8',
    gap: 10,
  },
  docIconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111b21',
    marginBottom: 2,
  },
  docSize: {
    fontSize: 12,
    color: '#667781',
  },
});
