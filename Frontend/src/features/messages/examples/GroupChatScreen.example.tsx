import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChatScreen } from '@/src/features/messages';
import { Ionicons } from '@expo/vector-icons';

/**
 * EJEMPLO DE IMPLEMENTACIÓN: Pantalla de Chat de Grupo
 * 
 * Esta es una pantalla de referencia que muestra cómo integrar
 * el sistema de chat en tiempo real para un grupo específico.
 * 
 * USO:
 * 1. Crear archivo: app/groups/[id]/chat.tsx
 * 2. Navegar con: router.push(`/groups/${groupId}/chat`)
 * 3. Pasar parámetros necesarios en la navegación
 * 
 * NOTA: Esta implementación asume que tienes un sistema de auth
 * que provee el usuario actual y su token JWT.
 */

export default function GroupChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    groupId: string;
    groupName: string;
    membershipId: string;
    isAdmin: string;
  }>();

  // Obtener usuario y token de tu sistema de auth
  // const { user, token } = useAuth(); // Implementar según tu auth
  
  // Placeholders - reemplazar con valores reales
  const userId = 1; // user?.id_user
  const token = 'your-jwt-token'; // token real del sistema de auth
  const userFullName = 'Usuario Ejemplo'; // user?.full_name

  // Parsear parámetros
  const groupId = parseInt(params.groupId || '0');
  const membershipId = parseInt(params.membershipId || '0');
  const isAdmin = params.isAdmin === 'true';
  const groupName = params.groupName || 'Grupo';

  // Validar parámetros requeridos
  if (!groupId || !membershipId || !userId || !token) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>
          Faltan parámetros requeridos para el chat
        </Text>
      </View>
    );
  }

  return (
    <>
      {/* Header personalizado */}
      <Stack.Screen
        options={{
          title: groupName,
          headerTitleAlign: 'center',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                // Navegar a detalles del grupo o mostrar opciones
                router.push(`/groups/${groupId}/details`);
              }}
              style={styles.headerButton}
            >
              <Ionicons name="information-circle-outline" size={24} color="#111827" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Pantalla de chat */}
      <ChatScreen
        groupId={groupId}
        userId={userId}
        token={token}
        isAdmin={isAdmin}
        userFullName={userFullName}
        serverUrl="http://localhost:3000" // Cambiar según tu entorno
      />
    </>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  headerButton: {
    padding: 8,
    marginHorizontal: 8,
  },
});

/**
 * EJEMPLO DE NAVEGACIÓN desde otra pantalla:
 * 
 * ```tsx
 * import { useRouter } from 'expo-router';
 * 
 * const router = useRouter();
 * const group = myGroup; // Tu objeto de grupo
 * 
 * const navigateToChat = () => {
 *   router.push({
 *     pathname: `/groups/${group.id_group}/chat`,
 *     params: {
 *       groupId: group.id_group.toString(),
 *       groupName: group.name,
 *       membershipId: userMembershipId.toString(),
 *       isAdmin: isUserAdmin.toString(),
 *     },
 *   });
 * };
 * 
 * <TouchableOpacity onPress={navigateToChat}>
 *   <Text>Abrir Chat</Text>
 * </TouchableOpacity>
 * ```
 * 
 * EJEMPLO DE OBTENCIÓN DE membershipId:
 * 
 * Debes obtener el id_membership del usuario en el grupo específico.
 * Esto puede venir de:
 * - La respuesta de GET /groups/:id
 * - Un endpoint como GET /groups/:id/my-membership
 * - Guardado localmente al unirte al grupo
 */
