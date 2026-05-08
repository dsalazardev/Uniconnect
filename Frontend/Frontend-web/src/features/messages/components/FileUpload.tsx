import React, { useRef } from 'react';
import { Paperclip } from 'lucide-react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  disabled?: boolean;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  disabled = false,
  maxFiles = 5,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0) {
      const selectedFiles = files.slice(0, maxFiles);
      onFileSelect(selectedFiles);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className={styles.hiddenInput}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleClick}
        className={styles.uploadButton}
        disabled={disabled}
        aria-label="Adjuntar archivo"
      >
        <Paperclip size={20} />
      </button>
    </div>
  );
};
