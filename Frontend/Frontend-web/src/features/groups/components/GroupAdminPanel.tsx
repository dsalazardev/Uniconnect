import React, { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, Check, X, Loader, Shield, User } from 'lucide-react';
import { groupsService } from '../services';
import type { GroupJoinRequest, GroupMembership } from '@uniconnect/shared';
import styles from './GroupAdminPanel.module.css';

interface GroupAdminPanelProps {
  groupId: number;
  ownerId?: number;
  canManage?: boolean;
}

export const GroupAdminPanel: React.FC<GroupAdminPanelProps> = ({
  groupId,
  ownerId,
  canManage = false,
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
      console.error('Error accepting request:', errorObj.message);
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
      console.error('Error rejecting request:', errorObj.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este miembro?')) return;
    setProcessingId(userId);
    try {
      await groupsService.removeMemberFromGroup(groupId, userId);
      setMembers((prev) => prev.filter((m) => m.id_user !== userId));
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      console.error('Error removing member:', errorObj.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleTransferOwnership = async (newOwnerId: number) => {
    if (!window.confirm('¿Transferir la propiedad del grupo? Esta acción no se puede deshacer.')) return;
    setProcessingId(newOwnerId);
    try {
      await groupsService.transferOwnership(groupId, newOwnerId);
      loadData();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      console.error('Error transferring ownership:', errorObj.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.centerContainer}>
        <Loader size={32} className={styles.spinner} />
        <p className={styles.loadingText}>Cargando panel...</p>
      </div>
    );
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
                    {processingId === req.id_request ? <Loader size={16} className={styles.spinner} /> : <Check size={16} />}
                  </button>
                  <button
                    className={styles.rejectButton}
                    onClick={() => handleRejectRequest(req.id_request)}
                    disabled={processingId === req.id_request}
                  >
                    {processingId === req.id_request ? <Loader size={16} className={styles.spinner} /> : <X size={16} />}
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
                    <button
                      className={styles.transferButton}
                      onClick={() => handleTransferOwnership(member.id_user)}
                      disabled={processingId === member.id_user}
                      title="Transferir propiedad"
                    >
                      {processingId === member.id_user ? <Loader size={16} className={styles.spinner} /> : <Shield size={16} />}
                    </button>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveMember(member.id_user)}
                      disabled={processingId === member.id_user}
                      title="Eliminar miembro"
                    >
                      {processingId === member.id_user ? <Loader size={16} className={styles.spinner} /> : <X size={16} />}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
