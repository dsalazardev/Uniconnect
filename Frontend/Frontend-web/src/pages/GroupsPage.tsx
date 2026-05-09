import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyGroups, useDiscoverGroups } from '@/features/groups/hooks';
import { useGroups } from '@/features/groups/hooks/useGroups';
import { useJoinRequest } from '@/features/groups/hooks/useJoinRequest';
import { authStore } from '@/features/auth/store/AuthStore';
import { GroupList, CreateGroupModal } from '@/features/groups/components';
import { useProfile } from '@/features/students/hooks/useProfile';
import { showToast } from '@/lib/toast';
import { Users, Search, Plus, User } from 'lucide-react';
import { LoadingSpinner } from '@/components/elements';
import type { Group } from '@uniconnect/shared';

type TabType = 'misGrupos' | 'descubrir';

export const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authStore.user;
  const userId = currentUser?.id_user;

  const [activeTab, setActiveTab] = useState<TabType>('misGrupos');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);
  const [pendingRequests, setPendingRequests] = useState<Set<number>>(new Set());

  const { myGroups, loading: myGroupsLoading, error: myGroupsError, reloadMyGroups } = useMyGroups(userId);
  const { groups: discoverGroups, loading: discoverLoading } = useDiscoverGroups(userId);
  const { deleteGroup, createGroup, isCreating } = useGroups();
  const joinMutation = useJoinRequest();
  const { profile, isLoading: profileLoading } = useProfile();

  const courses = profile?.courses?.map((c: any) => ({
    id_course: c.id_course,
    name: c.name || '',
  })) || [];

  const handleGroupPress = (groupId: number) => {
    navigate(`/groups/${groupId}`);
  };

  const handleEdit = (group: Group) => {
    console.log('Edit group:', group.id_group);
  };

  const handleDelete = async (groupId: number) => {
    if (window.confirm('¿Estás seguro de eliminar este grupo?')) {
      setDeletingGroupId(groupId);
      try {
        await deleteGroup(groupId);
      } finally {
        setDeletingGroupId(null);
      }
    }
  };

  const handleCreateGroup = () => {
    setCreateModalVisible(true);
  };

  const handleSaveNewGroup = async (groupData: { name: string; description: string; id_course: number }) => {
    await createGroup(groupData);
    setCreateModalVisible(false);
  };

  const handleRequestJoin = async (groupId: number) => {
    try {
      await joinMutation.mutateAsync(groupId);
      setPendingRequests(prev => new Set(prev).add(groupId));
      showToast.success('Solicitud enviada', 'Tu solicitud de unión fue enviada al administrador del grupo.');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'No se pudo enviar la solicitud';
      if (errorMessage.toLowerCase().includes('solicitud pendiente')) {
        setPendingRequests(prev => new Set(prev).add(groupId));
      }
      showToast.error('Error', errorMessage);
    }
  };

  const renderMisGruposTab = () => {
    if (myGroupsLoading) {
      return <LoadingSpinner size="lg" label="Cargando tus grupos..." />;
    }

    if (myGroupsError) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#ff4d4d' }}>{myGroupsError}</p>
          <button onClick={() => reloadMyGroups()} style={{ marginTop: 12, padding: '8px 20px', backgroundColor: '#D9B97E', border: 'none', borderRadius: 8, color: '#1a1a1a', fontWeight: 600, cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      );
    }

    if (!myGroups || myGroups.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Users size={80} color="#888" />
          <p style={{ color: '#aaa', fontSize: 20, fontWeight: 600, marginTop: 16 }}>No tienes grupos aún</p>
          <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>Crea tu primer grupo de estudio para comenzar</p>
          <button
            onClick={handleCreateGroup}
            style={{ marginTop: 24, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', backgroundColor: '#D9B97E', border: 'none', borderRadius: 8, color: '#1a1a1a', fontWeight: 600, cursor: 'pointer', fontSize: 16 }}
          >
            <Plus size={20} />
            Crear Grupo
          </button>
        </div>
      );
    }

    return (
      <GroupList
        groups={myGroups}
        onGroupPress={handleGroupPress}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deletingGroupId={deletingGroupId}
      />
    );
  };

  const renderDescubrirTab = () => {
    if (discoverLoading) {
      return <LoadingSpinner size="lg" label="Cargando grupos disponibles..." />;
    }

    if (!discoverGroups || discoverGroups.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Search size={80} color="#888" />
          <p style={{ color: '#aaa', fontSize: 20, fontWeight: 600, marginTop: 16 }}>No hay grupos disponibles</p>
          <p style={{ color: '#888', fontSize: 14, marginTop: 8 }}>Los grupos de tus materias aparecerán aquí</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
        {discoverGroups.map((group: Group) => {
          const isRequestSent = joinMutation.isPending && joinMutation.variables === group.id_group;
          const isPending = pendingRequests.has(group.id_group) || group.user_request_status === 'join_requested';
          const isInvited = group.user_request_status === 'invited';

          return (
            <div
              key={group.id_group}
              onClick={() => handleGroupPress(group.id_group)}
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: 12,
                padding: 16,
                cursor: 'pointer',
                border: '1px solid rgba(217, 185, 126, 0.2)',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: 'rgba(217, 185, 126, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Users size={24} color="#D9B97E" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 'bold', color: '#fff' }}>{group.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 14, color: '#D9B97E' }}>
                    {group.course?.name || 'Sin materia'}
                  </p>
                </div>
              </div>

              {group.description && (
                <p style={{ fontSize: 14, color: '#aaa', margin: '0 0 12px', lineHeight: '20px' }}>
                  {group.description}
                </p>
              )}

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(217, 185, 126, 0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <User size={14} color="#aaa" />
                  <span style={{ fontSize: 13, color: '#aaa' }}>
                    {group.owner?.full_name || 'Propietario'}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestJoin(group.id_group);
                  }}
                  disabled={isRequestSent || isPending || isInvited}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '8px 16px', borderRadius: 20, border: 'none',
                    fontSize: 13, fontWeight: 600, cursor: isRequestSent || isPending || isInvited ? 'not-allowed' : 'pointer',
                    backgroundColor: isInvited ? 'rgba(59, 130, 246, 0.1)' : isPending ? 'rgba(217, 185, 126, 0.1)' : '#D9B97E',
                    color: isInvited ? '#aaa' : isPending ? '#aaa' : '#1a1a1a',
                    borderWidth: isInvited || isPending ? 1 : 0,
                    borderStyle: 'solid',
                    borderColor: isInvited ? 'rgba(59, 130, 246, 0.3)' : isPending ? 'rgba(217, 185, 126, 0.3)' : 'transparent',
                  }}
                >
                  {isRequestSent ? (
                    <Loader size={16} />
                  ) : isInvited ? (
                    'Invitación pendiente'
                  ) : isPending ? (
                    'Solicitud enviada'
                  ) : (
                    'Solicitar'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const isLoading = myGroupsLoading && discoverLoading;

  if (isLoading) {
    return <LoadingSpinner size="lg" label="Cargando grupos..." />;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>Grupos de Estudio</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#aaa' }}>
            {activeTab === 'misGrupos'
              ? `${myGroups?.length || 0} ${(myGroups?.length || 0) === 1 ? 'grupo' : 'grupos'}`
              : `${discoverGroups?.length || 0} disponibles`}
          </p>
        </div>
        {activeTab === 'misGrupos' && (
          <button
            onClick={handleCreateGroup}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', backgroundColor: '#D9B97E', border: 'none',
              borderRadius: 22, color: '#1a1a1a', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={20} />
            Crear Grupo
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', backgroundColor: '#1a1a1a',
        borderBottom: '1px solid rgba(217, 185, 126, 0.3)',
        marginBottom: 16, borderRadius: '8px 8px 0 0',
      }}>
        <button
          onClick={() => setActiveTab('misGrupos')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '14px 0', border: 'none', background: 'none',
            borderBottom: `2px solid ${activeTab === 'misGrupos' ? '#D9B97E' : 'transparent'}`,
            color: activeTab === 'misGrupos' ? '#D9B97E' : '#888',
            fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}
        >
          <Users size={20} />
          Mis Grupos
          {myGroups && myGroups.length > 0 && (
            <span style={{
              backgroundColor: '#D9B97E', borderRadius: 10,
              padding: '2px 6px', minWidth: 20, textAlign: 'center',
              fontSize: 11, fontWeight: 'bold', color: '#1a1a1a',
            }}>
              {myGroups.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('descubrir')}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '14px 0', border: 'none', background: 'none',
            borderBottom: `2px solid ${activeTab === 'descubrir' ? '#D9B97E' : 'transparent'}`,
            color: activeTab === 'descubrir' ? '#D9B97E' : '#888',
            fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}
        >
          <Search size={20} />
          Descubrir
        </button>
      </div>

      {/* Content */}
      {activeTab === 'misGrupos' ? renderMisGruposTab() : renderDescubrirTab()}

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSave={handleSaveNewGroup}
        isCreating={isCreating}
        courses={profileLoading ? [] : courses}
      />
    </div>
  );
};
