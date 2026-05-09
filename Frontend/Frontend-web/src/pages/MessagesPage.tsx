import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/elements';
import { authStore } from '@/features/auth/store/AuthStore';
import { useConversations } from '@/features/messages/hooks/useConversations';

export const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authStore.user;
  const currentUserId = currentUser?.id_user;
  const { conversations, loading, error, reload } = useConversations(currentUserId);

  if (loading) {
    return <LoadingSpinner size="lg" label="Cargando conversaciones..." />;
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
        <AlertCircle size={48} color="#ff4d4d" />
        <p style={{ color: '#ff4d4d' }}>Error: {error}</p>
        <button onClick={reload} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
        <MessageCircle size={48} color="#666" />
        <h1>Mensajes</h1>
        <p style={{ color: '#888', textAlign: 'center', maxWidth: '400px' }}>
          No hay conversaciones — únete a un grupo para empezar a chatear
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Mensajes</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        {conversations.map((group) => {
          const isDM = group.is_direct_message ?? false;
          const otherUser = isDM
            ? (group.memberships || []).find((m) => m.id_user !== currentUserId)
            : undefined;
          const displayName = isDM
            ? (otherUser?.user?.full_name || 'Chat Privado')
            : (group.name || 'Grupo');
          const route = isDM ? `/chat/${group.id_group}` : `/groups/${group.id_group}`;

          return (
            <div
              key={group.id_group}
              onClick={() => navigate(route)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2a2a2a')}
            >
              <MessageCircle size={24} color={isDM ? '#10B981' : '#D9B97E'} />
              <div>
                <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>
                  {displayName}
                </p>
                {isDM ? (
                  <p style={{ color: '#10B981', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                    Chat privado
                  </p>
                ) : group.course && (
                  <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
                    {group.course.name}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
