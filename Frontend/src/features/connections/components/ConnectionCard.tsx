import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/src/features/auth/services/auth.service';
import { useRouter } from 'expo-router';
import { groupsService } from '@/src/features/groups/services/groups.service';
import { authStore } from '@/src/features/auth';

interface Connection {
  id_user: number;
  full_name: string;
  email: string;
  picture?: string;
  program?: { name: string };
}

interface ConnectionCardProps {
  connection: Connection;
}

export const ConnectionCard = ({ connection }: ConnectionCardProps) => {
  const router = useRouter();
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const token = authStore.accessToken || '';

  const handleViewProfile = () => {
    router.push(`/(tabs)/student-profile?id=${connection.id_user}`);
  };

  const handleStartChat = async () => {
    try {
      setIsLoadingChat(true);
      
      const response = await groupsService.findOrCreateDirectMessage(
        connection.id_user,
        token
      );

      // Navegar al ChatScreen con el grupo retornado
      router.push({
        pathname: `/groups/${response.group.id_group}`,
      });
    } catch (error) {
      console.error('Error al crear chat privado:', error);
      
      const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const errorMessage = axiosError.response?.data?.message || axiosError.message || 'Error al crear chat privado';
      
      if (axiosError.response?.status === 403) {
        Alert.alert('Error', 'No tienes una conexión aceptada con este usuario');
      } else if (axiosError.response?.status === 404) {
        Alert.alert('Error', 'Usuario no encontrado');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Avatar y Info */}
      <TouchableOpacity style={styles.leftSection} onPress={handleViewProfile}>
        {connection.picture ? (
          <Image
            source={{ uri: authService.getImageUri(connection.picture) }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={30} color="#666" />
          </View>
        )}
      </TouchableOpacity>

      {/* Contenido */}
      <View style={styles.content}>
        <TouchableOpacity onPress={handleViewProfile}>
          <Text style={styles.name}>{connection.full_name}</Text>
        </TouchableOpacity>
        {connection.program && (
          <Text style={styles.program} numberOfLines={1}>
            {connection.program.name}
          </Text>
        )}
      </View>

      {/* Botón de Mensaje */}
      <TouchableOpacity
        style={styles.messageButton}
        onPress={handleStartChat}
        disabled={isLoadingChat}
        activeOpacity={0.7}
      >
        {isLoadingChat ? (
          <ActivityIndicator size="small" color="#D9B97E" />
        ) : (
          <Ionicons name="chatbubble-outline" size={24} color="#D9B97E" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
  },
  leftSection: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    backgroundColor: '#4a4a4a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  program: {
    fontSize: 13,
    color: '#aaa',
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(217, 185, 126, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
