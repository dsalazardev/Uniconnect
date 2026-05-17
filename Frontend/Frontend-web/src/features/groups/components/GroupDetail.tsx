import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useGroupInfo, useLeaveGroup } from '../hooks/useGroupInfo';
import { notificationObserver } from '@/features/notifications/services';
import { useDirectMessage } from '../hooks/useDirectMessage';
import { MemberList } from './MemberList';
import { InviteMemberModal } from './InviteMemberModal';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import { PendingTransferOwnerBanner } from './PendingTransferOwnerBanner';
import { TransferInvitationBanner } from './TransferInvitationBanner';
import { GroupAdminPanel } from './GroupAdminPanel';
import { SessionList } from '@/features/study-sessions/components/SessionList';
import { SessionCreateForm } from '@/features/study-sessions/components/SessionCreateForm';
import { useStudySessions } from '@/features/study-sessions/hooks/useStudySessions';
import { MessageList } from '@/features/messages/components/MessageList';
import { MessageInput } from '@/features/messages/components/MessageInput';
import { useChat } from '@/features/messages/hooks/useChat.tsx';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LoadingSpinner } from '@/components/elements';
import { authStore } from '@/features/auth/store/AuthStore';
import { showToast } from '@/lib/toast';
import { groupsService } from '../services';
import { ArrowLeft, AlertTriangle, BookOpen, LogOut, UserPlus, MoreVertical, User } from 'lucide-react';
import { PollCreationModal } from '@/features/messages/components/PollCreationModal';
import styles from './GroupDetail.module.css';

export const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const groupId = parseInt(id as string);
  const focusRequestId = searchParams.get('focusRequestId')
    ? parseInt(searchParams.get('focusRequestId')!)
    : undefined;
  const { data: groupInfo, isLoading, error, refetch } = useGroupInfo(groupId);
  const leaveGroup = useLeaveGroup();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);

  // Member management state (for MemberList action buttons in the panel)
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{ id: number; name: string } | null>(null);
  const [memberTransferTarget, setMemberTransferTarget] = useState<{ id: number; name: string } | null>(null);
  const [processingMemberId, setProcessingMemberId] = useState<number | null>(null);

  const dm = useDirectMessage();
  const [availableUsers, setAvailableUsers] = useState<Array<{ id_user: number; full_name: string; email?: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const currentUser = authStore.user;
  const currentUserId = currentUser?.id_user ?? 0;
  const token = authStore.accessToken ?? '';

  const isMember = groupInfo?.isMember ?? false;
  const isOwner = groupInfo?.isOwner ?? false;

  const studySessions = useStudySessions(groupId);

  // DM detection — la info del destinatario viene del navigation state (pasada al hacer clic
  // en "Mensaje privado") para mostrarla de inmediato, sin esperar al refetch de groupInfo
  const navState = location.state as {
    recipientId?: number;
    recipientName?: string | null;
    recipientPicture?: string | null;
  } | null;

  const isDirectMessage = groupInfo?.is_direct_message ?? false;

  const otherMembership = isDirectMessage
    ? (groupInfo?.memberships || []).find(
        (m) => (m.id_user ?? m.user?.id_user) !== currentUserId
      )
    : undefined;

  // Prioridad: navigation state > memberships > fallback al email
  const recipientName =
    navState?.recipientName ||
    otherMembership?.user?.full_name ||
    otherMembership?.user?.email?.split('@')[0] ||
    'Usuario';

  const recipientPicture =
    navState?.recipientPicture !== undefined
      ? navState.recipientPicture
      : (otherMembership?.user?.picture ?? null);

  const recipientId =
    navState?.recipientId ||
    otherMembership?.id_user ||
    otherMembership?.user?.id_user;

  // Chat hook: only initialize when user is a member
  const chat = useChat({
    groupId,
    userId: currentUserId,
    token,
    userFullName: currentUser?.full_name || 'Usuario',
    recipientUserId: recipientId,
  });

  // Issue 3 fix: reset panel when navigating between group/chat routes
  useEffect(() => {
    setShowInfoPanel(false);
  }, [id]);

  // Refetch group info in real-time when any notification arrives (transfer events, etc.)
  useEffect(() => {
    const unsubscribe = notificationObserver.subscribe(() => {
      refetch?.();
    });
    return unsubscribe;
  }, [refetch]);

  // Auto-open info panel when arriving from a join-request notification
  useEffect(() => {
    if (focusRequestId && isOwner && !isLoading) {
      setShowInfoPanel(true);
    }
  }, [focusRequestId, isOwner, isLoading]);

  // Issue 4 fix: DM back button goes to /groups, not history(-1)
  const handleGoBack = () => {
    if (location.pathname.startsWith('/chat/')) {
      navigate('/groups');
    } else {
      navigate(-1);
    }
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

  const handleOpenInvite = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const connections = await groupsService.getConnectionsWithCourse(groupId);
      const membersIds = new Set((groupInfo?.memberships || []).map((m) => m.id_user));
      const available = (Array.isArray(connections) ? connections : []).filter(
        (u: any) => !membersIds.has(u.id_user)
      );
      setAvailableUsers(available);
      setShowInviteModal(true);
    } catch {
      showToast.error('Error', 'No se pudieron cargar los usuarios disponibles.');
    } finally {
      setLoadingUsers(false);
    }
  }, [groupId, groupInfo]);

  const handleSendInvite = async (userId: number) => {
    await groupsService.sendInvitation({
      id_group: groupId,
      inviter_id: currentUserId,
      invitee_id: userId,
    });
    showToast.success('Invitación enviada', 'La invitación fue enviada correctamente.');
  };

  // Member management handlers (called from MemberList in the info panel)
  const handleMemberTransfer = (userId: number) => {
    const member = (groupInfo?.memberships || []).find((m) => m.id_user === userId);
    setMemberTransferTarget({ id: userId, name: member?.user?.full_name || 'Usuario' });
  };

  const confirmMemberTransfer = async () => {
    if (!memberTransferTarget) return;
    setProcessingMemberId(memberTransferTarget.id);
    try {
      await groupsService.requestOwnershipTransfer(groupId, memberTransferTarget.id);
      showToast.success('Solicitud enviada', `Se notificó a ${memberTransferTarget.name}.`);
      refetch?.();
    } catch (err: any) {
      showToast.error('Error', err?.message || 'No se pudo solicitar la transferencia.');
    } finally {
      setProcessingMemberId(null);
      setMemberTransferTarget(null);
    }
  };

  const handleMemberRemove = (userId: number) => {
    const member = (groupInfo?.memberships || []).find((m) => m.id_user === userId);
    setRemoveMemberTarget({ id: userId, name: member?.user?.full_name || 'Usuario' });
  };

  const confirmMemberRemove = async () => {
    if (!removeMemberTarget) return;
    setProcessingMemberId(removeMemberTarget.id);
    try {
      await groupsService.removeMemberFromGroup(groupId, removeMemberTarget.id);
      showToast.success('Miembro eliminado');
      refetch?.();
    } catch (err: any) {
      showToast.error('Error', err?.message || 'No se pudo eliminar al miembro.');
    } finally {
      setProcessingMemberId(null);
      setRemoveMemberTarget(null);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleGoBack} className={styles.backButton}>
            <ArrowLeft size={18} /> Volver
          </button>
          <h1 className={styles.headerTitle}>Cargando...</h1>
        </div>
        <LoadingSpinner size="lg" label="Cargando grupo..." />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !groupInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button onClick={handleGoBack} className={styles.backButton}>
            <ArrowLeft size={18} /> Volver
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

  const displayName = isDirectMessage ? recipientName : groupInfo.name;

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <button onClick={handleGoBack} className={styles.backButton}>
          <ArrowLeft size={18} /> Volver
        </button>

        {isDirectMessage ? (
          /* DM header: avatar + nombre + estado de presencia */
          <div className={styles.dmHeaderCenter}>
            <div className={styles.dmAvatarWrapper}>
              {recipientPicture ? (
                <img src={recipientPicture} alt={recipientName} className={styles.dmAvatar} />
              ) : (
                <div className={styles.dmAvatarPlaceholder}>
                  <User size={18} />
                </div>
              )}
              <span className={`${styles.dmPresenceDot} ${chat.isRecipientOnline ? styles.dmPresenceOnline : styles.dmPresenceOffline}`} />
            </div>
            <div className={styles.dmHeaderInfo}>
              <span className={styles.dmHeaderName}>{recipientName}</span>
              <span className={`${styles.dmHeaderStatus} ${chat.isRecipientOnline ? styles.dmStatusOnline : styles.dmStatusOffline}`}>
                {chat.isRecipientOnline ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </div>
        ) : (
          <h1 className={styles.headerTitle}>{displayName}</h1>
        )}

        {/* Three-dots: only for group members (not DMs) */}
        {isMember && !isDirectMessage && (
          <button
            className={styles.menuButton}
            onClick={() => setShowInfoPanel(true)}
            title="Información del grupo"
          >
            <MoreVertical size={20} />
          </button>
        )}
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className={styles.content}>
        {isMember ? (
          /* Member: full-screen chat */
          <div className={styles.chatSection}>
            <div className={styles.chatContainer}>
              <MessageList
                messages={chat.messages}
                currentUserId={currentUserId}
                loading={chat.loading}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onFilePress={(file) => chat.downloadFile(file)}
                onVotePoll={chat.castVote}
                onLoadMore={chat.loadMoreMessages}
                hasMore={chat.hasMore}
                isLoadingMore={chat.isLoadingMore}
              />
              <MessageInput
                onSend={handleSendOrEdit}
                disabled={!chat.isConnected && chat.messages.length === 0}
                placeholder="Escribe un mensaje..."
                editingMessageId={editingMessageId}
                initialText={editingText}
                onCancelEdit={handleCancelEdit}
                groupId={groupId}
                onPollClick={() => setShowPollModal(true)}
              />
              {showPollModal && (
                <PollCreationModal
                  onClose={() => setShowPollModal(false)}
                  onSubmit={chat.createPoll}
                />
              )}
            </div>
          </div>
        ) : (
          /* Non-member: show group info directly */
          <div className={styles.nonMemberContent}>
            <div className={styles.section}>
              <h2 className={styles.groupName}>{displayName}</h2>
              {!isDirectMessage && groupInfo.description && (
                <p className={styles.description}>{groupInfo.description}</p>
              )}
              {!isDirectMessage && groupInfo.course && (
                <div className={styles.courseInfo}>
                  <BookOpen size={16} className={styles.courseIcon} />
                  <span className={styles.courseName}>{groupInfo.course.name}</span>
                </div>
              )}
              {!isDirectMessage && (
                <div className={styles.statusRow}>
                  <span className={`${styles.statusDot} ${groupInfo.pending_owner_id ? styles.statusDotPending : styles.statusDotActive}`} />
                  <span className={`${styles.statusLabel} ${groupInfo.pending_owner_id ? styles.statusLabelPending : styles.statusLabelActive}`}>
                    {groupInfo.pending_owner_id ? 'Transfiriendo propiedad' : 'Activo'}
                  </span>
                </div>
              )}
            </div>
            {!isDirectMessage && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Miembros</h3>
                <MemberList
                  memberships={groupInfo.memberships || []}
                  canManage={false}
                  ownerId={groupInfo.owner?.id_user}
                  currentUserId={currentUserId}
                  loadingUserId={dm.loadingUserId}
                  onDirectMessage={(userId, memberInfo) => dm.openDirectMessage(userId, memberInfo)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right slide-in info panel ───────────────────────────────────────── */}
      {showInfoPanel && (
        <>
          <div
            className={styles.panelBackdrop}
            onClick={() => setShowInfoPanel(false)}
          />
          <div className={styles.infoPanel}>

            {/* Panel header */}
            <div className={styles.infoPanelHeader}>
              <button
                className={styles.infoPanelCloseButton}
                onClick={() => setShowInfoPanel(false)}
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className={styles.infoPanelTitle}>Información del grupo</h2>
              {groupInfo.canManageMembers && (
                <button
                  onClick={() => { setShowInfoPanel(false); handleOpenInvite(); }}
                  className={styles.infoPanelInviteBtn}
                  title="Invitar miembros"
                  disabled={loadingUsers}
                >
                  <UserPlus size={18} />
                </button>
              )}
            </div>

            {/* Panel scrollable content */}
            <div className={styles.infoPanelContent}>

              {/* Transfer banners */}
              {groupInfo.pending_owner_id === currentUserId && (
                <TransferInvitationBanner
                  groupId={groupId}
                  ownerName={groupInfo.owner?.full_name}
                  onResolved={() => refetch?.()}
                />
              )}
              {groupInfo.pending_owner_id && groupInfo.pending_owner_id !== currentUserId && (
                <PendingTransferOwnerBanner
                  groupId={groupId}
                  candidateName={
                    groupInfo.memberships?.find(
                      (m) => m.id_user === groupInfo.pending_owner_id
                    )?.user?.full_name
                  }
                  onResolved={() => refetch?.()}
                />
              )}

              {/* Group info */}
              <div className={styles.section}>
                <h2 className={styles.groupName}>{groupInfo.name}</h2>
                {groupInfo.description && (
                  <p className={styles.description}>{groupInfo.description}</p>
                )}
                {groupInfo.course && (
                  <div className={styles.courseInfo}>
                    <BookOpen size={16} className={styles.courseIcon} />
                    <span className={styles.courseName}>{groupInfo.course.name}</span>
                  </div>
                )}
                <div className={styles.statusRow}>
                  <span className={`${styles.statusDot} ${groupInfo.pending_owner_id ? styles.statusDotPending : styles.statusDotActive}`} />
                  <span className={`${styles.statusLabel} ${groupInfo.pending_owner_id ? styles.statusLabelPending : styles.statusLabelActive}`}>
                    {groupInfo.pending_owner_id ? 'Transfiriendo propiedad' : 'Activo'}
                  </span>
                </div>
              </div>

              {/* Members — with DM + Transfer + Remove buttons */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Miembros</h3>
                <MemberList
                  memberships={groupInfo.memberships || []}
                  canManage={groupInfo.canManageMembers || false}
                  ownerId={groupInfo.owner?.id_user}
                  currentUserId={currentUserId}
                  loadingUserId={dm.loadingUserId}
                  onDirectMessage={(userId, memberInfo) => {
                    setShowInfoPanel(false);
                    dm.openDirectMessage(userId, memberInfo);
                  }}
                  onTransfer={isOwner ? handleMemberTransfer : undefined}
                  onRemove={isOwner ? handleMemberRemove : undefined}
                />
              </div>

              {/* Admin panel (pending requests only, no duplicate members) */}
              {isOwner && (
                <div className={styles.section}>
                  <GroupAdminPanel
                    groupId={groupId}
                    ownerId={groupInfo.owner?.id_user}
                    canManage={groupInfo.canManageMembers || false}
                    showMembersSection={false}
                    focusRequestId={focusRequestId}
                    onInvite={() => { setShowInfoPanel(false); handleOpenInvite(); }}
                  />
                </div>
              )}

              {/* Study sessions — visible for all members */}
              {isMember && !groupInfo.is_direct_message && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Sesiones de estudio</h3>
                  {studySessions.loading ? (
                    <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Cargando...</p>
                  ) : (
                    <SessionList
                      sessions={studySessions.sessions}
                      currentUserId={currentUserId}
                      isOwner={isOwner}
                      onCancel={studySessions.cancelInstance}
                      onUpdateAttendance={studySessions.updateAttendance}
                    />
                  )}
                  {isMember && !showSessionForm && (
                    <button
                      onClick={() => setShowSessionForm(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'none',
                        border: '1px dashed rgba(217,185,126,0.4)',
                        borderRadius: 6, color: '#D9B97E', fontSize: 13,
                        fontWeight: 600, padding: '8px 12px', cursor: 'pointer',
                        width: '100%', justifyContent: 'center', marginTop: 8,
                      }}
                    >
                      + Programar sesión
                    </button>
                  )}
                  {showSessionForm && (
                    <SessionCreateForm
                      onSubmit={async (dto) => {
                        await studySessions.createSession(dto);
                        setShowSessionForm(false);
                      }}
                      onCancel={() => setShowSessionForm(false)}
                    />
                  )}
                </div>
              )}

            </div>

            {/* Panel footer actions */}
            <div className={styles.panelActions}>
              <button
                onClick={() => { setShowInfoPanel(false); handleLeaveGroup(); }}
                className={styles.leaveButton}
                disabled={!!groupInfo?.pending_owner_id}
              >
                <LogOut size={16} /> Salir del grupo
              </button>
            </div>

          </div>
        </>
      )}

      {/* ── Modals (logic unchanged) ────────────────────────────────────────── */}
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

      <ConfirmModal
        visible={removeMemberTarget !== null}
        title="Eliminar miembro"
        message={`¿Eliminar a ${removeMemberTarget?.name || 'este usuario'} del grupo?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmMemberRemove}
        onCancel={() => setRemoveMemberTarget(null)}
        loading={processingMemberId === removeMemberTarget?.id}
      />

      <ConfirmModal
        visible={memberTransferTarget !== null}
        title="Transferir propiedad"
        message={`¿Transferir la propiedad del grupo a ${memberTransferTarget?.name || 'este usuario'}?`}
        confirmLabel="Transferir"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={confirmMemberTransfer}
        onCancel={() => setMemberTransferTarget(null)}
        loading={processingMemberId === memberTransferTarget?.id}
      />

      <InviteMemberModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleSendInvite}
        isInviting={loadingUsers}
        availableUsers={availableUsers}
      />

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
