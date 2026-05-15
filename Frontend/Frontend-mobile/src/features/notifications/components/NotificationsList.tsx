import React from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NotificationCard } from './NotificationCard';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { authStore } from '@/src/features/auth';
import { notificationsStore } from '../store/notifications.store';
import type { NotificationType } from '../types';

type ReadFilter = 'all' | 'read' | 'unread';

const TYPE_LABELS: Record<NotificationType, string> = {
    connection_request: 'Conexión',
    message: 'Mensaje',
    group_invitation: 'Invitación a grupo',
    group_invitation_accepted: 'Invitación aceptada',
    user_joined_group: 'Nuevo miembro',
    group_join_request: 'Solicitud de ingreso',
    group_join_request_accepted: 'Solicitud aceptada',
    group_join_request_rejected: 'Solicitud rechazada',
    member_accepted: 'Miembro aceptado',
    member_removed: 'Miembro eliminado',
    join_request: 'Solicitud de ingreso',
    mention: 'Mención',
    admin_transfer_requested: 'Transferencia de admin',
    admin_transfer_accepted: 'Transferencia aceptada',
    admin_transfer_declined: 'Transferencia rechazada',
};

const READ_FILTER_LABELS: Record<ReadFilter, string> = {
    all: 'Todas',
    unread: 'No leídas',
    read: 'Leídas',
};

export function NotificationsList() {
    const authToken = authStore.accessToken;
    const router = useRouter();

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
    } as any);

    const [activeTypeFilter, setActiveTypeFilter] = React.useState<NotificationType | null>(null);
    const [activeReadFilter, setActiveReadFilter] = React.useState<ReadFilter>('all');

    // Sincronizar el conteo global con la store
    React.useEffect(() => {
        notificationsStore.setUnreadCount(unreadCount);
    }, [unreadCount]);

    // CA5: auto-marcar como leídas 2s después de abrir la pantalla.
    // Deps vacíos son intencionales: mount = pantalla abierta, unmount = usuario volvió atrás.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
        const hasUnread = notifications.some((n) => !n.is_read);
        if (!hasUnread) return;
        const timer = setTimeout(markAllAsRead, 2000);
        return () => clearTimeout(timer);
    }, []);

    const availableTypes = React.useMemo(
        () => [...new Set(notifications.map((n) => n.notification_type))],
        [notifications],
    );

    const filteredNotifications = React.useMemo(() => {
        return notifications.filter((n) => {
            if (activeTypeFilter && n.notification_type !== activeTypeFilter) return false;
            if (activeReadFilter === 'read' && !n.is_read) return false;
            if (activeReadFilter === 'unread' && n.is_read) return false;
            return true;
        });
    }, [notifications, activeTypeFilter, activeReadFilter]);

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
            <View style={styles.containerEmpty}>
                <View style={styles.header}>
                    <View style={styles.headerSpacer} />
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => router.push('/notifications/preferences' as any)}
                    >
                        <Ionicons name="settings-outline" size={22} color="#aaa" />
                    </TouchableOpacity>
                </View>
                <View style={styles.center}>
                    <Ionicons name="notifications-off-outline" size={64} color="#666" />
                    <Text style={styles.emptyText}>No tienes notificaciones</Text>
                </View>
            </View>
        );
    }

    const hasUnread = notifications.some(n => !n.is_read);

    return (
        <View style={styles.container}>
            {/* Header con acciones */}
            <View style={styles.header}>
                {hasUnread && (
                    <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={handleMarkAllAsRead}
                    >
                        <Ionicons name="checkmark-done" size={20} color="#D9B97E" />
                        <Text style={styles.markAllButtonText}>
                            Marcar todas como leídas
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => router.push('/notifications/preferences' as any)}
                >
                    <Ionicons name="settings-outline" size={22} color="#aaa" />
                </TouchableOpacity>
            </View>

            {/* Filtro por tipo */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.typeFilterRow}
                contentContainerStyle={styles.typeFilterContent}
            >
                <TouchableOpacity
                    style={[styles.typeChip, activeTypeFilter === null && styles.typeChipActive]}
                    onPress={() => setActiveTypeFilter(null)}
                >
                    <Text style={[styles.typeChipText, activeTypeFilter === null && styles.typeChipTextActive]}>
                        Todos
                    </Text>
                </TouchableOpacity>
                {availableTypes.map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.typeChip, activeTypeFilter === type && styles.typeChipActive]}
                        onPress={() => setActiveTypeFilter(type)}
                    >
                        <Text style={[styles.typeChipText, activeTypeFilter === type && styles.typeChipTextActive]}>
                            {TYPE_LABELS[type] ?? type}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Toggle leída/no leída */}
            <View style={styles.readFilterRow}>
                {(['all', 'unread', 'read'] as ReadFilter[]).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.readFilterButton, activeReadFilter === f && styles.readFilterButtonActive]}
                        onPress={() => setActiveReadFilter(f)}
                    >
                        <Text style={[styles.readFilterText, activeReadFilter === f && styles.readFilterTextActive]}>
                            {READ_FILTER_LABELS[f]}
                        </Text>
                    </TouchableOpacity>
                ))}
                <Text style={styles.resultCount}>
                    {filteredNotifications.length}/{notifications.length}
                </Text>
            </View>

            <FlatList
                data={filteredNotifications}
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
                        <Ionicons name="filter-outline" size={40} color="#666" />
                        <Text style={styles.emptyText}>
                            Sin resultados para los filtros seleccionados
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
    containerEmpty: {
        flex: 1,
        backgroundColor: '#363636',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
        backgroundColor: '#1a1a1a',
    },
    headerSpacer: {
        flex: 1,
    },
    settingsButton: {
        padding: 4,
        marginLeft: 12,
    },
    markAllButton: {
        flex: 1,
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
    // Filtro por tipo
    typeFilterRow: {
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    typeFilterContent: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 8,
        flexDirection: 'row',
    },
    typeChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#3a3a3a',
        backgroundColor: '#2a2a2a',
    },
    typeChipActive: {
        backgroundColor: 'rgba(217, 185, 126, 0.15)',
        borderColor: '#D9B97E',
    },
    typeChipText: {
        fontSize: 13,
        color: '#aaa',
    },
    typeChipTextActive: {
        color: '#D9B97E',
        fontWeight: '600',
    },
    // Toggle leída/no leída
    readFilterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#1a1a1a',
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
        gap: 4,
    },
    readFilterButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#3a3a3a',
        backgroundColor: '#2a2a2a',
    },
    readFilterButtonActive: {
        backgroundColor: 'rgba(217, 185, 126, 0.15)',
        borderColor: '#D9B97E',
    },
    readFilterText: {
        fontSize: 12,
        color: '#aaa',
    },
    readFilterTextActive: {
        color: '#D9B97E',
        fontWeight: '600',
    },
    resultCount: {
        marginLeft: 'auto',
        fontSize: 12,
        color: '#666',
    },
    // Generales
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
