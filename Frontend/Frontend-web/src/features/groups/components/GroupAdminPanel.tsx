import React, { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, Check, X, Shield, User, Star } from 'lucide-react';
import { LoadingSpinner } from '@/components/elements';
import { ConfirmModal } from '@/components/ConfirmModal';
import { groupsService } from '../services';
import { useMakeMemberAdmin } from '../hooks/useGroupInfo';
import { showToast } from '@/lib/toast';
import type { GroupJoinRequest, GroupMembership } from '@uniconnect/shared';
import styles from './GroupAdminPanel.module.css';

interface GroupAdminPanelProps {
  groupId: number;
  ownerId?: number;
  canManage?: boolean;
  onInvite?: () => void;
}

export const GroupAdminPanel: React.FC<GroupAdminPanelProps> = ({
  groupId,
  ownerId,
  canManage = false,
  onInvite,
}) => {
  const [pendingRequests, setPendingRequests] = useState<GroupJoinRequest[]>([]);
  const [members, setMembers] = useState<GroupMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [requestsResult, groupInfo] = await Promise.all([
        groupsService.getGroupJoinRequests(groupId),
        groupsService.getGroupInfo(groupId),
      ]);

      setPendingRequests(requestsResult);
      setMembers(groupInfo.memberships || []);
      setError(null);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Error al cargar datos del grupo');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAcceptRequest = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      await groupsService.acceptJoinRequest(groupId, requestId);
      setPendingRequests((prev) => prev.filter((r) => r.id_request !== requestId));
      loadData();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast.error('Error', errorObj.message || 'No se pudo aceptar la solicitud.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setProcessingId(requestId);
    try {
      await groupsService.rejectJoinRequest(groupId, requestId);
      setPendingRequests((prev) => prev.filter((r) => r.id_request !== requestId));
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast.error('Error', errorObj.message || 'No se pudo rechazar la solicitud.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    const member = members.find((m) => m.id_user === userId);
    setRemoveMemberTarget({ id: userId, name: member?.user?.full_name || 'Usuario' });
  };

  const confirmRemoveMember = async () => {
    if (!removeMemberTarget) return;
    setProcessingId(removeMemberTarget.id);
    try {
      await groupsService.removeMemberFromGroup(groupId, removeMemberTarget.id);
      setMembers((prev) => prev.filter((m) => m.id_user !== removeMemberTarget.id));
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast.error('Error', errorObj.message || 'No se pudo eliminar al miembro.');
    } finally {
      setProcessingId(null);
      setRemoveMemberTarget(null);
    }
  };

  const handleTransferOwnership = async (newOwnerId: number) => {
    const member = members.find((m) => m.id_user === newOwnerId);
    setTransferConfirmTarget({ id: newOwnerId, name: member?.user?.full_name || 'Usuario' });
  };

  const confirmTransferOwnership = async () => {
    if (!transferConfirmTarget) return;
    setProcessingId(transferConfirmTarget.id);
    try {
      await groupsService.requestOwnershipTransfer(groupId, transferConfirmTarget.id);
      showToast.success('Solicitud enviada', `Se notificó a ${transferConfirmTarget.name} sobre la transferencia.`);
      loadData();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast.error('Error', errorObj.message || 'No se pudo solicitar la transferencia.');
    } finally {
      setProcessingId(null);
      setTransferConfirmTarget(null);
    }
  };

  const makeAdminMutation = useMakeMemberAdmin();
  const [makeAdminTarget, setMakeAdminTarget] = useState<{ id: number; name: string } | null>(null);
  const [rejectConfirmTarget, setRejectConfirmTarget] = useState<number | null>(null);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<{ id: number; name: string } | null>(null);
  const [transferConfirmTarget, setTransferConfirmTarget] = useState<{ id: number; name: string } | null>(null);

  const handleMakeAdmin = async () => {
    if (!makeAdminTarget) return;
    setProcessingId(makeAdminTarget.id);
    try {
      await makeAdminMutation.mutateAsync({ groupId, memberId: makeAdminTarget.id });
      loadData();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      showToast.error('Error', errorObj.message || 'No se pudo asignar el rol de administrador.');
    } finally {
      setProcessingId(null);
      setMakeAdminTarget(null);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" label="Cargando panel..." />;
  }

  if (error) {
    return (
      <div className={styles.centerContainer}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryButton} onClick={loadData}>Reintentar</button>
      </div>
    );
  }

  return (
    <>
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <UserPlus size={20} color="#F97316" />
          <h3 className={styles.sectionTitle}>Solicitudes pendientes</h3>
          {pendingRequests.length > 0 && (
            <span className={styles.badge}>{pendingRequests.length}</span>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <div className={styles.emptyState}>
            <Check size={36} className={styles.checkIcon} />
            <p className={styles.emptyText}>Sin solicitudes pendientes</p>
          </div>
        ) : (
          pendingRequests.map((req) => (
            <div key={req.id_request} className={styles.requestRow}>
              <div className={styles.userInfo}>
                <User size={20} />
                <span>{req.requester?.full_name || `Usuario #${req.id_user}`}</span>
              </div>
              {canManage && (
                <div className={styles.actions}>
                  <button
                    className={styles.acceptButton}
                    onClick={() => handleAcceptRequest(req.id_request)}
                    disabled={processingId === req.id_request}
                  >
                    {processingId === req.id_request ? <div className={styles.spinner} /> : <Check size={16} />}
                  </button>
                  <button
                    className={styles.rejectButton}
                    onClick={() => setRejectConfirmTarget(req.id_request)}
                    disabled={processingId === req.id_request}
                  >
                    {processingId === req.id_request ? <div className={styles.spinner} /> : <X size={16} />}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Users size={20} color="#D9B97E" />
          <h3 className={styles.sectionTitle}>Miembros actuales</h3>
          {members.length > 0 && (
            <span className={styles.badgeGold}>{members.length}</span>
          )}
          {canManage && onInvite && (
            <button
              className={styles.inviteButton}
              onClick={onInvite}
              title="Invitar miembros"
            >
              <UserPlus size={16} />
              <span>Invitar</span>
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={36} className={styles.emptyIcon} />
            <p className={styles.emptyText}>No hay miembros aún</p>
          </div>
        ) : (
          members.map((member) => {
            const isOwner = member.id_user === ownerId;
            return (
              <div key={member.id_membership} className={styles.memberRow}>
                <div className={styles.userInfo}>
                  <User size={20} />
                  <span>{member.user?.full_name || `Usuario #${member.id_user}`}</span>
                  {isOwner && <Shield size={14} className={styles.shieldIcon} />}
                  {member.role === 'admin' && !isOwner && (
                    <Shield size={14} className={styles.adminIcon} />
                  )}
                </div>
                {canManage && !isOwner && (
                  <div className={styles.actions}>
                    {!member.is_admin && (
                      <button
                        className={styles.makeAdminButton}
                        onClick={() => setMakeAdminTarget({ id: member.id_user, name: member.user?.full_name || 'Usuario' })}
                        disabled={processingId === member.id_user}
                        title="Hacer administrador"
                      >
                        {processingId === member.id_user ? <div className={styles.spinner} /> : <Star size={16} />}
                      </button>
                    )}
                    <button
                      className={styles.transferButton}
                      onClick={() => handleTransferOwnership(member.id_user)}
                      disabled={processingId === member.id_user}
                      title="Transferir propiedad"
                    >
                      {processingId === member.id_user ? <div className={styles.spinner} /> : <Shield size={16} />}
                    </button>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveMember(member.id_user)}
                      disabled={processingId === member.id_user}
                      title="Eliminar miembro"
                    >
                      {processingId === member.id_user ? <div className={styles.spinner} /> : <X size={16} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>

      {/* Make Admin Confirmation */}
      <ConfirmModal
        visible={makeAdminTarget !== null}
        title="Hacer Administrador"
        message={`¿Convertir a ${makeAdminTarget?.name || 'este usuario'} en administrador del grupo?`}
        confirmLabel="Hacer Admin"
        cancelLabel="Cancelar"
        variant="info"
        onConfirm={handleMakeAdmin}
        onCancel={() => setMakeAdminTarget(null)}
        loading={makeAdminTarget !== null && processingId === makeAdminTarget.id}
      />

      {/* Reject Request Confirmation */}
      <ConfirmModal
        visible={rejectConfirmTarget !== null}
        title="Rechazar solicitud"
        message="¿Estás seguro de rechazar esta solicitud de acceso?"
        confirmLabel="Rechazar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (rejectConfirmTarget !== null) {
            handleRejectRequest(rejectConfirmTarget);
          }
          setRejectConfirmTarget(null);
        }}
        onCancel={() => setRejectConfirmTarget(null)}
      />

      {/* Remove Member Confirmation */}
      <ConfirmModal
        visible={removeMemberTarget !== null}
        title="Eliminar miembro"
        message={`¿Estás seguro de eliminar a ${removeMemberTarget?.name || 'este usuario'} del grupo?`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={confirmRemoveMember}
        onCancel={() => setRemoveMemberTarget(null)}
        loading={removeMemberTarget !== null && processingId === removeMemberTarget.id}
      />

      {/* Transfer Ownership Confirmation */}
      <ConfirmModal
        visible={transferConfirmTarget !== null}
        title="Transferir propiedad"
        message={`¿Solicitar a ${transferConfirmTarget?.name || 'este usuario'} que sea el nuevo administrador del grupo?`}
        confirmLabel="Transferir"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={confirmTransferOwnership}
        onCancel={() => setTransferConfirmTarget(null)}
        loading={transferConfirmTarget !== null && processingId === transferConfirmTarget.id}
      />
    </>
  );
};
