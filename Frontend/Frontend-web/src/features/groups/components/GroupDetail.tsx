import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupInfo, useLeaveGroup } from '../hooks/useGroupInfo';
import { useTransferOwnership } from '../hooks/useTransferOwnership';
import { MemberList } from './MemberList';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import { PendingTransferOwnerBanner } from './PendingTransferOwnerBanner';
import { GroupAdminPanel } from './GroupAdminPanel';
import { MessageList } from '@/features/messages/components/MessageList';
import { MessageInput } from '@/features/messages/components/MessageInput';
import { useChat } from '@/features/messages/hooks/useChat';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LoadingSpinner } from '@/components/elements';
import { authStore } from '@/features/auth/store/AuthStore';
import { ArrowLeft, AlertTriangle, BookOpen, LogOut } from 'lucide-react';
import styles from './GroupDetail.module.css';

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupId = parseInt(id as string);
  const { data: groupInfo, isLoading, error } = useGroupInfo(groupId);
  const leaveGroup = useLeaveGroup();
  const transferOwnership = useTransferOwnership();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);

  const currentUser = authStore.user;
  const currentUserId = currentUser?.id_user ?? 0;
  const token = authStore.accessToken ?? '';

  const isMember = groupInfo?.isMember ?? false;
  const isOwner = groupInfo?.isOwner ?? false;

  // DM detection
  const isDirectMessage = groupInfo?.is_direct_message ?? false;
  const otherUser = isDirectMessage
    ? (groupInfo?.memberships || []).find((m) => m.id_user !== currentUserId)
    : undefined;
  const otherUserName = otherUser?.user?.full_name || 'Chat Privado';

  // Chat hook: only initialize when user is a member
  const chat = useChat({
    groupId,
    userId: currentUserId,
    token,
    userFullName: currentUser?.full_name || 'Usuario',
  });

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleLeaveGroup = () => {
    if (isOwner && (groupInfo?.memberships || []).length > 1) {
      setShowTransferModal(true);
    } else {
      setShowLeaveConfirm(true);
    }
  };

  const confirmLeaveGroup = () => {
    leaveGroup.mutate(groupId, {
      onSuccess: () => {
        setShowLeaveConfirm(false);
        navigate('/groups');
      },
    });
  };

  const handleEditMessage = (message: { id_message: number; text_content: string }) => {
    setEditingMessageId(message.id_message);
    setEditingText(message.text_content || '');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSendOrEdit = (text: string) => {
    if (editingMessageId != null) {
      chat.editMessage(editingMessageId, text);
      setEditingMessageId(null);
      setEditingText('');
    } else {
      chat.sendMessage(text);
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    setDeletingMessageId(messageId);
  };

  const confirmDeleteMessage = () => {
    if (deletingMessageId != null) {
      chat.deleteMessage(deletingMessageId);
      setDeletingMessageId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleGoBack} className={styles.backButton}>
            <ArrowLeft size={20} /> Volver
          </button>
          <h1 className={styles.headerTitle}>Cargando...</h1>
        </div>
        <LoadingSpinner size="lg" label="Cargando grupo..." />
      </div>
    );
  }

  if (error || !groupInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleGoBack} className={styles.backButton}>
            <ArrowLeft size={20} /> Volver
          </button>
          <h1 className={styles.headerTitle}>Error</h1>
        </div>
        <div className={styles.errorContainer}>
          <AlertTriangle size={48} className={styles.errorIcon} />
          <p className={styles.errorText}>{error?.message || 'Grupo no encontrado'}</p>
          <button className={styles.retryButton} onClick={handleGoBack}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleGoBack} className={styles.backButton}>
          <ArrowLeft size={20} /> Volver
        </button>
        <h1 className={styles.headerTitle}>
          {isDirectMessage ? otherUserName : 'Detalle del Grupo'}
        </h1>
        {isMember && !isDirectMessage && (
          <button
            onClick={handleLeaveGroup}
            className={styles.leaveButton}
            title="Abandonar Grupo"
            disabled={!!groupInfo?.pending_owner_id}
          >
            <LogOut size={18} />
            <span className={styles.leaveButtonText}>Salir</span>
          </button>
        )}
      </div>

      <div className={styles.content}>
        {!isDirectMessage && groupInfo.pending_owner_id && (
          <PendingTransferOwnerBanner
            candidateName={
              groupInfo.memberships?.find(
                (m) => m.id_user === groupInfo.pending_owner_id
              )?.user?.full_name
            }
          />
        )}

        <div className={styles.section}>
          <h2 className={styles.groupName}>
            {isDirectMessage ? otherUserName : groupInfo.name}
          </h2>
          {!isDirectMessage && groupInfo.description && (
            <p className={styles.description}>{groupInfo.description}</p>
          )}
          {!isDirectMessage && groupInfo.course && (
            <div className={styles.courseInfo}>
              <BookOpen size={20} className={styles.courseIcon} />
              <span className={styles.courseName}>{groupInfo.course.name}</span>
            </div>
          )}
        </div>

        {!isDirectMessage && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Miembros</h3>
            <MemberList
              memberships={groupInfo.memberships || []}
              canManage={groupInfo.canManageMembers || false}
              ownerId={groupInfo.owner?.id_user}
            />
          </div>
        )}

        {isOwner && !isDirectMessage && (
          <div className={styles.section}>
            <GroupAdminPanel
              groupId={groupId}
              ownerId={groupInfo.owner?.id_user}
              canManage={groupInfo.canManageMembers || false}
            />
          </div>
        )}

        {/* Chat Section - only for members */}
        {isMember && (
          <div className={styles.chatSection}>
            <h3 className={styles.sectionTitle}>
              {isDirectMessage ? 'Chat Privado' : 'Chat del Grupo'}
            </h3>
            <div className={styles.chatContainer}>
              <MessageList
                messages={chat.messages}
                currentUserId={currentUserId}
                loading={chat.loading}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
              />
              <MessageInput
                onSend={handleSendOrEdit}
                disabled={!chat.isConnected && chat.messages.length === 0}
                placeholder="Escribe un mensaje..."
                editingMessageId={editingMessageId}
                initialText={editingText}
                onCancelEdit={handleCancelEdit}
                groupId={groupId}
              />
            </div>
          </div>
        )}
      </div>

      {/* Leave Group Confirmation */}
      <ConfirmModal
        visible={showLeaveConfirm}
        title={isDirectMessage ? 'Abandonar Chat' : 'Abandonar Grupo'}
        message={
          isDirectMessage
            ? '¿Estás seguro de que quieres salir de este chat privado?'
            : `¿Estás seguro de que quieres salir del grupo "${groupInfo.name}"?`
        }
        confirmLabel="Abandonar"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={confirmLeaveGroup}
        onCancel={() => setShowLeaveConfirm(false)}
        loading={leaveGroup.isPending}
      />

      {/* Delete Message Confirmation */}
      <ConfirmModal
        visible={deletingMessageId != null}
        title="Eliminar mensaje"
        message="¿Estás seguro de que quieres eliminar este mensaje? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmDeleteMessage}
        onCancel={() => setDeletingMessageId(null)}
      />

      {/* Transfer Ownership Modal */}
      {groupInfo && (
        <TransferOwnershipModal
          visible={showTransferModal}
          groupId={groupId}
          groupName={groupInfo.name}
          members={groupInfo.memberships || []}
          currentOwnerId={groupInfo.owner?.id_user ?? currentUserId}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            setShowTransferModal(false);
            navigate('/groups');
          }}
        />
      )}
    </div>
  );
};
