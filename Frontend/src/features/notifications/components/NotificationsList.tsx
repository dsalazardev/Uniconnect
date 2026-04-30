import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NotificationCard } from './NotificationCard';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { authStore } from '@/src/features/auth';
import { useNotificationsStore } from '../store/notifications.store';

export function NotificationsList() {
    const authToken = authStore.accessToken;
    const setUnreadCount = useNotificationsStore(state => state.setUnreadCount);

    const {
        notifications,
        unreadCount,
        loading,
        error,
        markAllAsRead,
        handleNotificationPress,
        reloadNotifications,
    } = useUserNotifications({ 
        token: authToken || ''
    });

    // Sincronizar el conteo global con la store
    React.useEffect(() => {
        setUnreadCount(unreadCount);
    }, [unreadCount, setUnreadCount]);

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            console.error('Error al marcar todas como leídas:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#D9B97E" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={reloadNotifications}
                >
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!notifications.length) {
        return (
            <View style={styles.center}>
                <Ionicons name="notifications-off-outline" size={64} color="#666" />
                <Text style={styles.emptyText}>
                    No tienes notificaciones
                </Text>
            </View>
        );
    }

    const hasUnread = notifications.some(n => !n.is_read);

    return (
        <View style={styles.container}>
            {/* Header con botón "Marcar todas como leídas" */}
            {hasUnread && (
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.markAllButton}
                        onPress={handleMarkAllAsRead}
                    >
                        <Ionicons name="checkmark-done" size={20} color="#D9B97E" />
                        <Text style={styles.markAllButtonText}>
                            Marcar todas como leídas
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id_notification.toString()}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={reloadNotifications}
                        tintColor="#D9B97E"
                    />
                }
                renderItem={({ item }) => (
                    <NotificationCard
                        notification={item}
                        onPress={() => handleNotificationPress(item)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.emptyText}>
                            No tienes notificaciones
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#363636',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
        backgroundColor: '#1a1a1a',
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D9B97E',
    },
    markAllButtonText: {
        color: '#D9B97E',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#363636',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#aaa',
        marginTop: 16,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#ff6b6b',
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#D9B97E',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#1a1a1a',
        fontSize: 16,
        fontWeight: '600',
    },
});