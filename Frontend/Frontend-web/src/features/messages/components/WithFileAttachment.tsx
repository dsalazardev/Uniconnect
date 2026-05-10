import React from 'react';
import { FileText, Video, Grid, Archive, Paperclip, Download } from 'lucide-react';
import type { MessageFile } from '@uniconnect/shared';
import styles from './WithFileAttachment.module.css';

interface WithFileAttachmentProps {
  files: MessageFile[];
  onFilePress?: (file: { id_file: number; file_name: string }) => void;
  children: React.ReactNode;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(
  mime: string,
  isPdf: boolean,
  isVideo: boolean,
): { icon: React.ReactNode; iconColor: string } {
  if (isPdf) return { icon: <FileText size={28} />, iconColor: '#FF5722' };
  if (isVideo) return { icon: <Video size={28} />, iconColor: '#7C3AED' };
  if (mime.includes('word') || mime.includes('document'))
    return { icon: <FileText size={28} />, iconColor: '#2563EB' };
  if (mime.includes('sheet') || mime.includes('excel'))
    return { icon: <Grid size={28} />, iconColor: '#16A34A' };
  if (mime.includes('zip') || mime.includes('rar') || mime.includes('compressed'))
    return { icon: <Archive size={28} />, iconColor: '#D97706' };
  return { icon: <Paperclip size={28} />, iconColor: '#6B7280' };
}

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
      <div className={styles.imageWrapper}>
        <img src={file.url} alt={file.file_name} className={styles.image} />
        <button className={styles.imageOverlay} onClick={handlePress} aria-label="Descargar imagen">
          <Download size={56} color="rgba(255,255,255,0.85)" />
        </button>
      </div>
    );
  }

  const { icon, iconColor } = getFileIcon(mime, isPdf, isVideo);

  return (
    <button className={styles.docRow} onClick={handlePress} aria-label={`Descargar ${file.file_name}`}>
      <div className={styles.docIconBox} style={{ backgroundColor: iconColor }}>
        {icon}
      </div>
      <div className={styles.docInfo}>
        <span className={styles.docName}>{file.file_name || 'Archivo adjunto'}</span>
        <span className={styles.docSize}>
          {file.size != null ? formatFileSize(file.size) : '—'}
        </span>
      </div>
      <Download size={24} color="#54656f" />
    </button>
  );
};

export const WithFileAttachment: React.FC<WithFileAttachmentProps> = ({
  files,
  onFilePress,
  children,
}) => {
  if (!files || files.length === 0) {
    return <>{children}</>;
  }

  return (
    <div>
      {children}
      <div className={styles.filesContainer}>
        {files.map((file) => (
          <FileItem key={`file-${file.id_file}`} file={file} onFilePress={onFilePress} />
        ))}
      </div>
    </div>
  );
};
