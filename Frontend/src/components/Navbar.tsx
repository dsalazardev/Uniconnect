import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { authStore, authController } from "@/src/features/auth";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "../hooks/useResponsive";
import { useConnections } from "../features/connections/hooks/useConnections";
import { NotificationIcon } from "src/features/notifications/components/NotificationIcon";
import { useNotificationsStore } from "@/src/features/notifications/store/notifications.store";
import { notificationsService } from "@/src/features/notifications/services/notifications.service";
import { notificationObserver } from "@/src/features/notifications/services/notification-observer.service";
import { AppState } from "react-native";

export const Navbar = () => {
  const user = authStore.user;
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const { isMobile } = useResponsive();
  const { pendingRequests } = useConnections();
  const token = authStore.accessToken || '';
  const setUnreadCount = useNotificationsStore(state => state.setUnreadCount);

  // Cargar conteo de notificaciones no leídas (igual que useConnections carga pendingRequests)
  const loadUnreadCount = async () => {
    if (!token) return;
    try {
      const data = await notificationsService.getUnreadCount(token);
      setUnreadCount(data.count);
    } catch (error) {
      console.log('Error cargando conteo de notificaciones:', error);
    }
  };

  // Cargar conteo inicial
  useEffect(() => {
    if (!token) return;
    loadUnreadCount();
  }, [token]);

  // Recargar cuando vuelve a foreground (AppState)
  useEffect(() => {
    if (!token) return;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        loadUnreadCount();
      }
    });

    return () => subscription.remove();
  }, [token]);

  // Observer pattern: actualizar cuando se marcan notificaciones como leídas
  useEffect(() => {
    if (!token) return;

    const unsubscribe = notificationObserver.subscribe(() => {
      loadUnreadCount();
    });

    return unsubscribe;
  }, [token]);

  const handleLogout = () => {
    authController.logout();
  };

  const navigateTo = (path: any) => {
    setMenuVisible(false);
    router.push(path);
  };

  const getImageUri = (image: string | null | undefined): string | undefined => {
    if (!image) return undefined;
    if (image.startsWith("data:image")) return image;
    if (image.startsWith("http://") || image.startsWith("https://")) return image;
    return `data:image/jpeg;base64,${image}`;
  };

  return (
    <View style={styles.navbar}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={28} color="#D9B97E" />
        </TouchableOpacity>

        <View style={styles.userInfo}>
          <Image
            source={{
              uri:
                getImageUri(user?.picture) || "https://via.placeholder.com/40",
            }}
            style={styles.avatar}
          />
          <Text style={styles.userName}>{user?.full_name?.split(" ")[0]}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {/* Botón de notificaciones */}
        <NotificationIcon
          onPress={() => navigateTo("/(tabs)/notifications")}
          color="#D9B97E"
        />

        {/* Botón de logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MODAL DEL MENÚ LATERAL */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[styles.menuContent, { width: isMobile ? "60%" : "25%" }]}
          >
            <Text style={styles.menuTitle}>UniConnect</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("/(tabs)")}
            >
              <Ionicons name="home-outline" size={22} color="#D9B97E" />
              <Text style={styles.menuText}>Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("/(tabs)/profile")}
            >
              <Ionicons name="person-circle-outline" size={22} color="#D9B97E" />
              <Text style={styles.menuText}>Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("/(tabs)/community")}
            >
              <Ionicons name="people-outline" size={22} color="#D9B97E" />
              <Text style={styles.menuText}>Comunidad</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("/(tabs)/groups")}
            >
              <Ionicons name="chatbubbles-outline" size={22} color="#D9B97E" />
              <Text style={styles.menuText}>Grupos de estudio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("/(tabs)/connections")}
            >
              <View style={{ position: "relative" }}>
                <Ionicons name="git-network-outline" size={22} color="#D9B97E" />
                {pendingRequests.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {pendingRequests.length > 99 ? "99+" : pendingRequests.length}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuText}>Vínculos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigateTo("/(tabs)/events")}
            >
              <Ionicons name="calendar-outline" size={22} color="#D9B97E" />
              <Text style={styles.menuText}>Eventos Académicos</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="exit-outline" size={22} color="#ff4d4d" />
              <Text style={[styles.menuText, { color: "#ff4d4d" }]}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217, 185, 126, 0.3)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftSection: { flexDirection: "row", alignItems: "center" },
  rightSection: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuButton: { marginRight: 15 },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: "#4a4a4a",
    borderWidth: 1,
    borderColor: "#D9B97E",
  },
  userName: { fontSize: 16, fontWeight: "600", color: "#fff" },
  logoutButton: {
    backgroundColor: "#ff4d4d",
    padding: 8,
    borderRadius: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  menuContent: {
    backgroundColor: "#1a1a1a",
    width: "25%",
    height: "100%",
    padding: 20,
    paddingTop: 50,
    borderRightWidth: 1,
    borderRightColor: "rgba(217, 185, 126, 0.3)",
  },
  menuTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 30, color: "#D9B97E" },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217, 185, 126, 0.2)",
  },
  menuText: { fontSize: 18, marginLeft: 15, color: "#fff" },
  divider: { height: 1, backgroundColor: "rgba(217, 185, 126, 0.3)", marginVertical: 20 },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#ff4d4d",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
});