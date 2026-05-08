import React, { useRef } from 'react';
import { Modal } from '@/components/elements';
import { Paperclip, FileText, Image, X } from 'lucide-react';
import styles from './FilePickerModal.module.css';

interface FileItem {
  file: File;
  name: string;
  size: number;
}

interface FilePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onFilesSelected: (files: FileItem[]) => void;
}

export const FilePickerModal: React.FC<FilePickerModalProps> = ({
  visible,
  onClose,
  onFilesSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<FileItem[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const newFiles: FileItem[] = Array.from(fileList).map((file) => ({
      file,
      name: file.name,
      size: file.size,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
      setSelectedFiles([]);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={handleClose} title="Adjuntar archivos">
      <div className={styles.container}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className={styles.hiddenInput}
          accept="*/*"
        />

        <button
          className={styles.selectButton}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={20} />
          Seleccionar archivos
        </button>

        {selectedFiles.length > 0 && (
          <div className={styles.fileList}>
            {selectedFiles.map((file, index) => (
              <div key={index} className={styles.fileItem}>
                {file.file.type.startsWith('image/') ? (
                  <Image size={16} className={styles.fileIcon} />
                ) : (
                  <FileText size={16} className={styles.fileIcon} />
                )}
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <button
                  className={styles.removeButton}
                  onClick={() => handleRemoveFile(index)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={handleClose}>
            Cancelar
          </button>
          <button
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
          >
            Subir {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
};
