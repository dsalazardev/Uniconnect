import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Modal,
    Pressable,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { NotificationCard } from './NotificationCard';
import { useUserNotifications } from '../hooks/useUserNotifications';
import { authStore } from '@/src/features/auth';
import { notificationsStore } from '../store/notifications.store';
import type { NotificationType } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

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
    group_created: 'Grupo creado',
    group_deleted: 'Grupo eliminado',
    event_published: 'Evento publicado',
};

const READ_LABELS: Record<ReadFilter, string> = {
    all: 'Todas',
    unread: 'No leídas',
    read: 'Leídas',
};

// ── CustomSelect (igual al de Eventos) ───────────────────────────────────────

interface SelectOption<T> { label: string; value: T; }

function CustomSelect<T extends string | null>({
    options,
    value,
    onChange,
    placeholder,
    modalTitle,
    isActive,
}: {
    options: SelectOption<T>[];
    value: T;
    onChange: (v: T) => void;
    placeholder: string;
    modalTitle: string;
    isActive: boolean;
}) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    return (
        <>
            <TouchableOpacity
                style={[styles.selectBtn, isActive && styles.selectBtnActive]}
                onPress={() => setOpen(true)}
                activeOpacity={0.8}
            >
                <Text
                    style={[styles.selectBtnText, isActive && styles.selectBtnTextActive]}
                    numberOfLines={1}
                >
                    {selected ? selected.label : placeholder}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>

            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={() => setOpen(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>{modalTitle}</Text>
                        {options.map((opt) => {
                            const isCurrent = opt.value === value;
                            return (
                                <TouchableOpacity
                                    key={String(opt.value)}
                                    style={[styles.modalOption, isCurrent && styles.modalOptionActive]}
                                    onPress={() => { onChange(opt.value); setOpen(false); }}
                                >
                                    <Text style={[styles.modalOptionText, isCurrent && styles.modalOptionTextActive]}>
                                        {opt.label}
                                    </Text>
                                    {isCurrent && <Ionicons name="checkmark" size={16} color="#D9B97E" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

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
    } = useUserNotifications({ token: authToken || '' } as any);

    const [activeTypeFilter, setActiveTypeFilter] = React.useState<NotificationType | null>(null);
    const [activeReadFilter, setActiveReadFilter] = React.useState<ReadFilter>('all');

    // Sincronizar conteo global
    React.useEffect(() => {
        notificationsStore.setUnreadCount(unreadCount);
    }, [unreadCount]);

    // CA5: auto-marcar como leídas 2s después de que los datos estén listos.
    // Se re-evalúa cuando loading cambia: cuando pasa de true→false los datos ya están disponibles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
        if (loading) return;
        const hasUnread = notifications.some((n) => !n.is_read);
        if (!hasUnread) return;
        const timer = setTimeout(markAllAsRead, 2000);
        return () => clearTimeout(timer);
    }, [loading]);

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
        } catch (err) {
            console.error('Error al marcar todas como leídas:', err);
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
                <TouchableOpacity style={styles.retryButton} onPress={reloadNotifications}>
                    <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const hasUnread = notifications.some(n => !n.is_read);
    const hasActiveFilter = activeTypeFilter !== null || activeReadFilter !== 'all';

    const typeOptions: SelectOption<NotificationType | null>[] = [
        { label: 'Todos los tipos', value: null },
        ...availableTypes.map((t) => ({ label: TYPE_LABELS[t] ?? t, value: t as NotificationType | null })),
    ];

    const readOptions: SelectOption<ReadFilter>[] = [
        { label: 'Todas', value: 'all' },
        { label: 'No leídas', value: 'unread' },
        { label: 'Leídas', value: 'read' },
    ];

    return (
        <View style={styles.container}>
            {/* ── Header ────────────────────────────────────────────────────── */}
            <View style={styles.header}>
                {hasUnread && (
                    <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
                        <Ionicons name="checkmark-done" size={20} color="#D9B97E" />
                        <Text style={styles.markAllButtonText}>Marcar todas como leídas</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => router.push('/notifications/preferences' as any)}
                >
                    <Ionicons name="settings-outline" size={22} color="#aaa" />
                </TouchableOpacity>
            </View>

            {/* ── Filter bar (mismo patrón que Eventos) ─────────────────────── */}
            <View style={styles.filterBar}>
                <View style={styles.filterRow}>
                    <View style={[styles.filterSection, { flex: 1 }]}>
                        <Text style={styles.filterLabel}>Tipo</Text>
                        <CustomSelect
                            options={typeOptions}
                            value={activeTypeFilter}
                            onChange={setActiveTypeFilter}
                            placeholder="Todos los tipos"
                            modalTitle="Tipo de notificación"
                            isActive={activeTypeFilter !== null}
                        />
                    </View>

                    <View style={[styles.filterSection, { flex: 1 }]}>
                        <Text style={styles.filterLabel}>Estado</Text>
                        <CustomSelect
                            options={readOptions}
                            value={activeReadFilter}
                            onChange={setActiveReadFilter}
                            placeholder="Todas"
                            modalTitle="Estado"
                            isActive={activeReadFilter !== 'all'}
                        />
                    </View>
                </View>

                {/* Contador + limpiar filtros */}
                <View style={styles.filterMeta}>
                    <Text style={styles.resultCount}>
                        {filteredNotifications.length} de {notifications.length} notificaciones
                    </Text>
                    {hasActiveFilter && (
                        <TouchableOpacity
                            onPress={() => { setActiveTypeFilter(null); setActiveReadFilter('all'); }}
                        >
                            <Text style={styles.clearFilters}>Limpiar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ── Lista ─────────────────────────────────────────────────────── */}
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
                    <View style={styles.stateMsg}>
                        <Ionicons
                            name={notifications.length === 0 ? 'notifications-off-outline' : 'filter-outline'}
                            size={44}
                            color="#444"
                        />
                        <Text style={styles.stateMsgText}>
                            {notifications.length === 0
                                ? 'No tienes notificaciones'
                                : 'Sin resultados para los filtros seleccionados'}
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1e1e1e' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
        backgroundColor: '#1a1a1a',
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
    settingsButton: {
        padding: 4,
        marginLeft: 12,
    },

    // Filter bar (igual que Eventos)
    filterBar: {
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        marginHorizontal: 16,
        marginVertical: 12,
        padding: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        gap: 10,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
    },
    filterSection: { gap: 6 },
    filterLabel: { fontSize: 14, fontWeight: '500', color: '#aaa' },

    // Custom select button (igual que Eventos)
    selectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(217,185,126,0.2)',
        borderRadius: 8,
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 14,
        height: 48,
    },
    selectBtnActive: {
        borderColor: '#D9B97E',
        shadowColor: '#D9B97E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    selectBtnText: { fontSize: 14, color: '#6B7280', flex: 1, marginRight: 8 },
    selectBtnTextActive: { color: '#fff' },

    // Modal dropdown (igual que Eventos)
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: '#1e1e1e',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingTop: 12,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    modalTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    modalOptionActive: { backgroundColor: 'rgba(217,185,126,0.08)' },
    modalOptionText: { fontSize: 15, color: '#9CA3AF' },
    modalOptionTextActive: { color: '#D9B97E', fontWeight: '600' },

    // Contador y limpiar
    filterMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    resultCount: { fontSize: 12, color: '#6B7280' },
    clearFilters: { fontSize: 12, color: '#D9B97E', fontWeight: '600' },

    // States
    stateMsg: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        paddingVertical: 48,
    },
    stateMsgText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

    // List
    listContent: { paddingBottom: 24 },

    // Error / Retry
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        padding: 20,
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
