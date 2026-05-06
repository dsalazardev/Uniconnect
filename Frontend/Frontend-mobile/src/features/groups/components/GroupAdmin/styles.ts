import { StyleSheet } from 'react-native';

// Paleta compartida por todos los subcomponentes del GroupAdminPanel
// Colores base del proyecto: #1a1a1a (fondo), #D9B97E (gold), #0d0d0d (header)
export const adminStyles = StyleSheet.create({
  // ── Layout ─────────────────────────────────────────────────────────────────
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  inlineLoader: {
    marginVertical: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },

  // ── Error ──────────────────────────────────────────────────────────────────
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FCA5A5',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#FCA5A5',
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D9B97E',
  },
  retryText: {
    color: '#D9B97E',
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Badges de conteo ───────────────────────────────────────────────────────
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(249, 115, 22, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countBadgeGold: {
    backgroundColor: 'rgba(217, 185, 126, 0.2)',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Fila compartida (avatar + info + acciones) ─────────────────────────────
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(217, 185, 126, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  rowSub: {
    fontSize: 12,
    color: '#D9B97E',
    marginBottom: 2,
  },
  rowEmail: {
    fontSize: 11,
    color: '#999',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },

  // ── Botones de acción ──────────────────────────────────────────────────────
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  acceptBtn: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  rejectBtn: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  adminBtn: {
    borderColor: '#D9B97E',
    backgroundColor: 'rgba(217, 185, 126, 0.08)',
  },

  // ── Tarjetas ───────────────────────────────────────────────────────────────
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)',
  },

  // ── Badges de rol ──────────────────────────────────────────────────────────
  ownerBadge: {
    backgroundColor: 'rgba(217, 185, 126, 0.25)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  ownerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D9B97E',
  },
  adminBadge: {
    backgroundColor: 'rgba(100, 200, 255, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64c8ff',
  },

  // ── Selector de grupo ──────────────────────────────────────────────────────
  selectorScroll: {
    marginTop: 12,
  },
  selectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  selectorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.3)',
    backgroundColor: 'rgba(217, 185, 126, 0.05)',
    maxWidth: 180,
  },
  selectorChipActive: {
    borderColor: '#D9B97E',
    backgroundColor: 'rgba(217, 185, 126, 0.15)',
  },
  selectorChipText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    flexShrink: 1,
  },
  selectorChipTextActive: {
    color: '#D9B97E',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Mensaje directo (US-W03) ───────────────────────────────────────────────
  dmBtn: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },

  // ── Transferencia de ownership ─────────────────────────────────────────────
  transferBtn: {
    borderColor: '#A78BFA',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  transferPendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  transferPendingText: {
    fontSize: 11,
    color: '#A78BFA',
    fontWeight: '500',
    flexShrink: 1,
  },
  cancelTransferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  cancelTransferText: {
    fontSize: 10,
    color: '#A78BFA',
    fontWeight: '600',
  },
});
