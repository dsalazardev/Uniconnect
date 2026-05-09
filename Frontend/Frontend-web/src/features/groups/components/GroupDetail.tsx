import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupInfo, useLeaveGroup } from '../hooks/useGroupInfo';
import { MemberList } from './MemberList';
import { MessageList } from '@/features/messages/components/MessageList';
import { MessageInput } from '@/features/messages/components/MessageInput';
import { useChat } from '@/features/messages/hooks/useChat';
import { ConfirmModal } from '@/components/ConfirmModal';
import { authStore } from '@/features/auth/store/AuthStore';
import { ArrowLeft, AlertTriangle, BookOpen, LogOut } from 'lucide-react';
import styles from './GroupDetail.module.css';

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const groupId = parseInt(id as string);
  const { data: groupInfo, isLoading, error } = useGroupInfo(groupId);
  const leaveGroup = useLeaveGroup();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const currentUser = authStore.user;
  const currentUserId = currentUser?.id_user ?? 0;
  const token = authStore.accessToken ?? '';

  const isMember = groupInfo?.isMember ?? false;
  const isOwner = groupInfo?.isOwner ?? false;

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
    setShowLeaveConfirm(true);
  };

  const confirmLeaveGroup = () => {
    leaveGroup.mutate(groupId, {
      onSuccess: () => {
        setShowLeaveConfirm(false);
        navigate('/groups');
      },
    });
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
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Cargando grupo...</p>
        </div>
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
        <h1 className={styles.headerTitle}>Detalle del Grupo</h1>
        {isMember && !isOwner && (
          <button
            onClick={handleLeaveGroup}
            className={styles.leaveButton}
            title="Abandonar Grupo"
          >
            <LogOut size={18} />
            <span className={styles.leaveButtonText}>Salir</span>
          </button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.groupName}>{groupInfo.name}</h2>
          {groupInfo.description && (
            <p className={styles.description}>{groupInfo.description}</p>
          )}
          {groupInfo.course && (
            <div className={styles.courseInfo}>
              <BookOpen size={20} className={styles.courseIcon} />
              <span className={styles.courseName}>{groupInfo.course.name}</span>
            </div>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Miembros</h3>
          <MemberList
            memberships={groupInfo.memberships || []}
            canManage={groupInfo.canManageMembers || false}
            ownerId={groupInfo.owner?.id_user}
          />
        </div>

        {/* Chat Section - only for members */}
        {isMember && (
          <div className={styles.chatSection}>
            <h3 className={styles.sectionTitle}>Chat del Grupo</h3>
            <div className={styles.chatContainer}>
              <MessageList
                messages={chat.messages}
                currentUserId={currentUserId}
                loading={chat.loading}
              />
              <MessageInput
                onSend={chat.sendMessage}
                disabled={!chat.isConnected && chat.messages.length === 0}
                placeholder="Escribe un mensaje..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Leave Group Confirmation */}
      <ConfirmModal
        visible={showLeaveConfirm}
        title="Abandonar Grupo"
        message={`¿Estás seguro de que quieres salir del grupo "${groupInfo.name}"?`}
        confirmLabel="Abandonar"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={confirmLeaveGroup}
        onCancel={() => setShowLeaveConfirm(false)}
        loading={leaveGroup.isPending}
      />
    </div>
  );
};
