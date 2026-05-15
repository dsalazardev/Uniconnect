import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Paperclip, BarChart2 } from 'lucide-react';
import { filesService } from '../services/files.service';
import { showToast } from '@/lib/toast';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  editingMessageId?: number | null;
  initialText?: string;
  onCancelEdit?: () => void;
  groupId?: number;
  onPollClick?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Escribe un mensaje...',
  editingMessageId,
  initialText,
  onCancelEdit,
  groupId,
  onPollClick,
}) => {
  const [text, setText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = editingMessageId != null;

  useEffect(() => {
    if (isEditing && initialText) {
      setText(initialText);
    }
  }, [isEditing, initialText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape' && isEditing) {
      e.preventDefault();
      onCancelEdit?.();
      setText('');
    }
  };

  const handleCancel = () => {
    onCancelEdit?.();
    setText('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !groupId) return;

    setIsUploading(true);
    try {
      await filesService.uploadFiles(groupId, Array.from(files));
    } catch (err) {
      console.error('[MessageInput] Error uploading files:', err);
      showToast.error('Error', 'No se pudo subir el archivo. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className={styles.inputContainer}>
      {isEditing && (
        <div className={styles.editIndicator}>
          <span className={styles.editLabel}>Editando mensaje</span>
          <button
            type="button"
            className={styles.cancelEditButton}
            onClick={handleCancel}
            aria-label="Cancelar edición"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <div className={styles.inputRow}>
        {groupId && !isEditing && (
          <>
            <button
              type="button"
              className={styles.attachButton}
              onClick={triggerFileInput}
              disabled={isUploading || disabled}
              aria-label="Adjuntar archivo"
              title="Adjuntar archivo"
            >
              {isUploading ? (
                <div className={styles.spinnerSmall} />
              ) : (
                <Paperclip size={20} />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            {onPollClick && (
              <button
                type="button"
                className={styles.attachButton}
                onClick={onPollClick}
                disabled={disabled}
                aria-label="Crear encuesta"
                title="Crear encuesta"
              >
                <BarChart2 size={20} />
              </button>
            )}
          </>
        )}
        <textarea
          className={styles.input}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isEditing ? 'Edita el mensaje...' : placeholder}
          disabled={disabled || isUploading}
          rows={1}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!text.trim() || disabled || isUploading}
          aria-label={isEditing ? 'Guardar cambios' : 'Enviar mensaje'}
        >
          <Send size={20} />
        </button>
      </div>
    </form>
  );
};
