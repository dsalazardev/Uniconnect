import React, { useState } from 'react';
import { View, TextInput, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useCommunityLists } from '@/src/features/students/hooks/useCommunityLists';
import { StudentCard } from '@/src/features/students/components/StudentCard';
import { useRouter } from 'expo-router';
import { useConnections } from '@/src/features/connections/hooks/useConnections'; 

type CommunityTab = 'friends' | 'general';

export default function CommunityScreen() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<CommunityTab>('friends');
  const router = useRouter();
  const { openDirectMessage } = useConnections();
  const {
    connectedStudents,
    notConnectedStudents,
    connectedQuery,
    notConnectedQuery,
  } = useCommunityLists(search);

  const renderListState = () => {
    const isFriendsTab = activeTab === 'friends';
    const currentQuery = isFriendsTab ? connectedQuery : notConnectedQuery;
    const currentData = isFriendsTab ? connectedStudents : notConnectedStudents;
    const hasSearchTerm = search.trim().length > 0;

    if (currentQuery.isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D9B97E" />
        </View>
      );
    }

    if (currentQuery.isError) {
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>No se pudo cargar esta sección.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => currentQuery.refetch()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const getEmptyMessage = () => {
      if (hasSearchTerm) {
        return `No se encontraron resultados para "${search}"`;
      }
      return isFriendsTab ? 'Aún no tienes conexiones.' : 'No hay estudiantes disponibles.';
    };

    return (
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id_user.toString()}
        renderItem={({ item }) => (
          <StudentCard 
            student={item} 
            isFriend={isFriendsTab}
            onOpenDirectMessage={isFriendsTab ? openDirectMessage : undefined}
          />
        )}
        contentContainerStyle={styles.listContent}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
            {hasSearchTerm && (
              <Text style={styles.emptySubtext}>
                Intenta con otro término de búsqueda
              </Text>
            )}
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.content}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.backText}>← Volver al Inicio</Text>
      </TouchableOpacity>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar compañeros o materias..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'friends' && styles.tabButtonActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>Mis amigos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'general' && styles.tabButtonActive]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[styles.tabText, activeTab === 'general' && styles.tabTextActive]}>Comunidad general</Text>
        </TouchableOpacity>
      </View>

      {renderListState()}
    </View>
  );
}


const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: '#363636' },
  backButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#1a1a1a',
  },
  backText: {
    color: '#D9B97E',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: { 
    padding: 15, 
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 185, 126, 0.3)',
  },
  searchInput: { 
    backgroundColor: '#2a2a2a', 
    padding: 12, 
    borderRadius: 10,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#D9B97E',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 20, paddingTop: 16 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#aaa',
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 185, 126, 0.3)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#D9B97E',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#D9B97E',
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#D9B97E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: '#1a1a1a',
    fontWeight: '700',
  },
});