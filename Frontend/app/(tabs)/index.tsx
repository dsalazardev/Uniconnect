/**
 * Home Screen - Uniconnect
 * 
 * Rediseño v2 - Professional home screen with responsive layout
 * - Mobile: Single column with vertical scroll
 * - Desktop: 3-column layout (Sidebar + Content + Groups Panel)
 * - 100% aligned with DESIGN_TOKENS.md
 * - Zero-Any policy enforced
 * 
 * @see openspec/changes/redesign-home-screen-v2/
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsStore } from '@/src/features/events/store/events.store';
import { authStore } from '@/src/features/auth/store/AuthStore';
import { useResponsive } from '@/src/hooks/useResponsive';
import { EventType } from '@/src/features/events/types/event.types';
import { useMyGroups, useDiscoverGroups } from '@/src/features/groups/hooks/useMyGroups';
import { Group } from '@/src/features/groups/types';

// ============================================================================
// TYPES
// ============================================================================

interface HomeScreenProps {}

interface NavLink {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Event type colors from DESIGN_TOKENS.md
const EVENT_TYPE_COLORS: Record<EventType, string> = {
  [EventType.CONFERENCIA]: '#0056b3',
  [EventType.TALLER]: '#28a745',
  [EventType.SEMINARIO]: '#6f42c1',
  [EventType.COMPETENCIA]: '#fd7e14',
  [EventType.CULTURAL]: '#e83e8c',
  [EventType.DEPORTIVO]: '#20c997',
};


// Navigation links for sidebar
const NAV_LINKS: NavLink[] = [
  { id: 'home', label: 'Inicio', icon: 'home', route: '/(tabs)' },
  { id: 'events', label: 'Eventos', icon: 'calendar', route: '/(tabs)/events' },
  { id: 'groups', label: 'Grupos', icon: 'people', route: '/(tabs)/groups' },
  { id: 'community', label: 'Comunidad', icon: 'school', route: '/(tabs)/community' },
  { id: 'connections', label: 'Conexiones', icon: 'link', route: '/(tabs)/connections' },
  { id: 'notifications', label: 'Notificaciones', icon: 'notifications', route: '/(tabs)/notifications' },
  { id: 'profile', label: 'Perfil', icon: 'person', route: '/(tabs)/profile' },
];

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

/**
 * Header - Professional branding header
 * Displays "Uniconnect" title, institutional logo, and notification badge
 */
const Header: React.FC = observer(() => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          source={require('@/assets/Logo_de_la_Universidad_de_Caldas.svg.png')}
          style={styles.logo}
          accessibilityLabel="Logo Universidad de Caldas"
        />
        <Text style={styles.brandTitle}>Uniconnect</Text>
      </View>

    </View>
  );
});

/**
 * FacultyFilters - Horizontal chip filters for faculty selection
 */

/**
 * EventsCarousel - Horizontal scrollable carousel of upcoming events
 */
const EventsCarousel: React.FC = observer(() => {
  const router = useRouter();

  // Filter future events and sort by date
  const futureEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return eventsStore.events
      .filter((event) => new Date(event.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10); // Limit to 10 events
  }, [eventsStore.events]);

  if (eventsStore.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D9B97E" />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </View>
    );
  }

  if (futureEvents.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="calendar-outline" size={48} color="#666" />
        <Text style={styles.emptyText}>No hay eventos próximos</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.carouselScroll}
      contentContainerStyle={styles.carouselContent}
    >
      {futureEvents.map((event) => (
        <TouchableOpacity
          key={event.id_event}
          style={styles.eventCard}
          onPress={() => router.push(`/events/${event.id_event}`)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.eventTypeBadge,
              { backgroundColor: EVENT_TYPE_COLORS[event.type] },
            ]}
          >
            <Text style={styles.eventTypeText}>{event.type}</Text>
          </View>

          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.title}
          </Text>

          <View style={styles.eventMeta}>
            <Ionicons name="calendar-outline" size={14} color="#D9B97E" />
            <Text style={styles.eventMetaText}>
              {new Date(event.date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>

          <View style={styles.eventMeta}>
            <Ionicons name="time-outline" size={14} color="#D9B97E" />
            <Text style={styles.eventMetaText}>{event.time}</Text>
          </View>

          <View style={styles.eventMeta}>
            <Ionicons name="location-outline" size={14} color="#D9B97E" />
            <Text style={styles.eventMetaText} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
});

/**
 * GroupsSection - Display user's groups with premium styling
 */
const GroupsSection: React.FC = observer(() => {
  const router = useRouter();
  const { user, accessToken } = authStore;
  
  // Fetch user's groups using the real API
  const { myGroups, loading: groupsLoading, error: groupsError } = useMyGroups(
    user?.id_user, 
    accessToken || ''
  );

  if (groupsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D9B97E" />
        <Text style={styles.loadingText}>Cargando grupos...</Text>
      </View>
    );
  }

  if (groupsError) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="alert-circle-outline" size={48} color="#666" />
        <Text style={styles.emptyText}>Error al cargar grupos</Text>
      </View>
    );
  }

  if (myGroups.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="people-outline" size={48} color="#666" />
        <Text style={styles.emptyText}>No eres miembro de ningún grupo</Text>
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push('/(tabs)/groups')}
        >
          <Text style={styles.exploreButtonText}>Explorar grupos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mis Grupos</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
          <Text style={styles.seeAllLink}>Ver todos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.groupsGrid}>
        {myGroups.slice(0, 4).map((group) => (
          <TouchableOpacity
            key={group.id_group}
            style={styles.groupCard}
            onPress={() => router.push(`/groups/${group.id_group}`)}
            activeOpacity={0.7}
          >
            <View style={styles.groupCardHeader}>
              <Ionicons name="people" size={20} color="#D9B97E" />
              <Text style={styles.groupName} numberOfLines={1}>
                {group.name}
              </Text>
            </View>

            <Text style={styles.groupCourse} numberOfLines={1}>
              {group.course?.name || 'Sin materia'}
            </Text>

            <View style={styles.groupMeta}>
              <Ionicons name="person-outline" size={12} color="#888" />
              <Text style={styles.groupMetaText}>
                {group._count?.memberships || group.member_count || 0} miembros
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

/**
 * Sidebar - Desktop navigation sidebar
 */
const Sidebar: React.FC = () => {
  const router = useRouter();
  const currentRoute = '/(tabs)'; // Current route is home

  return (
    <View style={styles.sidebar}>
      {NAV_LINKS.map((link) => {
        const isActive = link.id === 'home';

        return (
          <TouchableOpacity
            key={link.id}
            style={[styles.navLink, isActive && styles.navLinkActive]}
            onPress={() => router.push(link.route as any)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={link.icon}
              size={20}
              color={isActive ? '#D9B97E' : '#888'}
            />
            <Text
              style={[styles.navLinkText, isActive && styles.navLinkTextActive]}
            >
              {link.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

/**
 * RightPanel - Desktop featured groups panel
 */
const RightPanel: React.FC = observer(() => {
  const router = useRouter();
  const { user, accessToken } = authStore;
  
  // Fetch discoverable groups (featured groups) using the real API
  const { groups: featuredGroups, loading: featuredLoading } = useDiscoverGroups(
    user?.id_user, 
    accessToken || ''
  );

  if (featuredLoading) {
    return (
      <View style={styles.rightPanel}>
        <Text style={styles.panelTitle}>Grupos Destacados</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#D9B97E" />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.rightPanel} showsVerticalScrollIndicator={false}>
      <Text style={styles.panelTitle}>Grupos Destacados</Text>

      {featuredGroups.slice(0, 8).map((group) => (
        <View key={group.id_group} style={styles.featuredGroupCard}>
          <View style={styles.featuredGroupInfo}>
            <Text style={styles.featuredGroupName} numberOfLines={1}>
              {group.name}
            </Text>
            <View style={styles.featuredGroupMeta}>
              <Ionicons name="person-outline" size={10} color="#888" />
              <Text style={styles.featuredGroupMetaText}>
                {group._count?.memberships || group.member_count || 0}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => router.push(`/groups/${group.id_group}`)}
            activeOpacity={0.7}
          >
            <Text style={styles.joinButtonText}>Ver</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const HomeScreen: React.FC<HomeScreenProps> = observer(() => {
  const { isMobile, isDesktop } = useResponsive();

  // Load events on mount
  useEffect(() => {
    eventsStore.loadEvents();
  }, []);

  // Mobile Layout
  if (isMobile) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Header />

        <View style={styles.content}>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximos Eventos</Text>
            <EventsCarousel />
          </View>

          <View style={styles.section}>
            <GroupsSection />
          </View>
        </View>
      </ScrollView>
    );
  }

  // Desktop Layout
  return (
    <View style={styles.desktopContainer}>
      {isDesktop && <Sidebar />}

      <ScrollView
        style={styles.centerFeed}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={styles.centerContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Próximos Eventos</Text>
            <EventsCarousel />
          </View>

          <View style={styles.section}>
            <GroupsSection />
          </View>
        </View>
      </ScrollView>

      {isDesktop && <RightPanel />}
    </View>
  );
});

// ============================================================================
// STYLES - Using tokens from DESIGN_TOKENS.md
// ============================================================================

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#000000', // colors.background.primary
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#000000', // colors.background.primary
  },
  content: {
    paddingHorizontal: 16, // spacing[8]
  },
  centerFeed: {
    flex: 1,
    backgroundColor: '#000000', // colors.background.primary
  },
  centerContent: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16, // spacing[8]
  },
  contentDesktop: {
    flex: 1,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  contentInner: {
    paddingHorizontal: 16, // spacing[8]
  },
  section: {
    marginTop: 24, // spacing[12]
    marginBottom: 24, // spacing[12]
  },

  // Header - home-header-branding
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // spacing[8]
    paddingVertical: 12, // spacing[6]
    backgroundColor: '#0d0d0d', // colors.background.header
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // spacing[6]
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  brandTitle: {
    fontSize: 24, // typography.fontSize['5xl']
    fontWeight: '700', // typography.fontWeight.bold
    color: '#D9B97E', // colors.primary.gold
    fontFamily: 'Roboto',
  },
  notificationBadge: {
    minWidth: 22, // From DESIGN_TOKENS.md countBadge
    height: 22,
    borderRadius: 11, // borderRadius['2xl']
    backgroundColor: 'rgba(249, 115, 22, 0.25)', // colors.semantic.warning.background
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6, // spacing[3]
  },
  notificationText: {
    fontSize: 11, // typography.fontSize.sm
    fontWeight: '700', // typography.fontWeight.bold
    color: '#ffffff', // colors.text.primary
  },

  // Filters - faculty-filters
  filtersScroll: {
    marginTop: 12, // spacing[6]
  },
  filtersContent: {
    paddingHorizontal: 16, // spacing[8]
    gap: 8, // gap.md
  },
  filterChip: {
    paddingVertical: 6, // From spec
    paddingHorizontal: 14, // From spec
    borderRadius: 20, // borderRadius['4xl']
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.3)', // colors.primary.gold + opacity
    backgroundColor: 'rgba(217, 185, 126, 0.05)', // colors.primary.gold5
  },
  filterChipActive: {
    borderColor: '#D9B97E', // colors.primary.gold
    backgroundColor: 'rgba(217, 185, 126, 0.15)', // colors.primary.gold15
  },
  filterChipText: {
    fontSize: 13, // typography.fontSize.md
    fontWeight: '500', // typography.fontWeight.medium
    color: '#888888', // colors.text.secondary
  },
  filterChipTextActive: {
    color: '#D9B97E', // colors.primary.gold
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12, // spacing[6]
  },
  sectionTitle: {
    fontSize: 18, // typography.fontSize['3xl']
    fontWeight: '700', // typography.fontWeight.bold
    color: '#ffffff', // colors.text.primary
  },
  seeAllLink: {
    fontSize: 14, // typography.fontSize.lg
    fontWeight: '600', // typography.fontWeight.semibold
    color: '#D9B97E', // colors.primary.gold
  },

  // Events Carousel - events-carousel
  carouselScroll: {
    marginTop: 12, // spacing[6]
  },
  carouselContent: {
    paddingHorizontal: 16, // spacing[8]
    gap: 12, // spacing[6]
  },
  eventCard: {
    width: 280, // From spec
    backgroundColor: 'rgba(26, 26, 26, 0.9)', // colors.background.cardTransparent
    borderRadius: 10, // borderRadius.xl
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)', // colors.primary.gold20
    padding: 12, // spacing[6]
  },
  eventTypeBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4, // spacing[2]
    paddingHorizontal: 8, // spacing[4]
    borderRadius: 4, // borderRadius.xs
    marginBottom: 8, // spacing[4]
  },
  eventTypeText: {
    fontSize: 10, // typography.fontSize.xs
    fontWeight: '700', // typography.fontWeight.bold
    color: '#ffffff', // colors.text.primary
  },
  eventTitle: {
    fontSize: 16, // typography.fontSize['2xl']
    fontWeight: '600', // typography.fontWeight.semibold
    color: '#ffffff', // colors.text.primary
    marginBottom: 8, // spacing[4]
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // spacing[3]
    marginTop: 4, // spacing[2]
  },
  eventMetaText: {
    fontSize: 11, // typography.fontSize.sm
    color: '#888888', // colors.text.secondary
  },

  // Groups Section - groups-quick-access
  groupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12, // spacing[6]
  },
  groupCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: 'rgba(26, 26, 26, 0.9)', // colors.background.cardTransparent
    borderRadius: 10, // borderRadius.xl
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.2)', // colors.primary.gold20
    padding: 12, // spacing[6]
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // gap.md
    marginBottom: 8, // spacing[4]
  },
  groupName: {
    flex: 1,
    fontSize: 14, // typography.fontSize.lg
    fontWeight: '600', // typography.fontWeight.semibold
    color: '#ffffff', // colors.text.primary
  },
  groupCourse: {
    fontSize: 11, // typography.fontSize.sm
    color: '#D9B97E', // colors.primary.gold
    marginBottom: 8, // spacing[4]
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // spacing[2]
  },
  groupMetaText: {
    fontSize: 11, // typography.fontSize.sm
    color: '#888888', // colors.text.secondary
  },

  // Sidebar - desktop-sidebar
  sidebar: {
    width: 240, // From spec
    backgroundColor: '#0d0d0d', // colors.background.header
    padding: 16, // spacing[8]
    gap: 8, // gap.md
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // spacing[6]
    paddingVertical: 10, // spacing[5]
    paddingHorizontal: 12, // spacing[6]
    borderRadius: 8, // borderRadius.md
  },
  navLinkActive: {
    backgroundColor: 'rgba(217, 185, 126, 0.1)', // colors.primary.gold10
  },
  navLinkText: {
    fontSize: 14, // typography.fontSize.lg
    fontWeight: '500', // typography.fontWeight.medium
    color: '#888888', // colors.text.secondary
  },
  navLinkTextActive: {
    color: '#D9B97E', // colors.primary.gold
  },

  // Right Panel - desktop-groups-panel
  rightPanel: {
    width: 300, // From spec
    backgroundColor: '#0d0d0d', // colors.background.header
    padding: 16, // spacing[8]
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(217, 185, 126, 0.1)', // colors.primary.gold + opacity
  },
  panelTitle: {
    fontSize: 16, // typography.fontSize['2xl']
    fontWeight: '700', // typography.fontWeight.bold
    color: '#ffffff', // colors.text.primary
    marginBottom: 16, // spacing[8]
  },
  featuredGroupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12, // spacing[6]
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(217, 185, 126, 0.1)',
  },
  featuredGroupInfo: {
    flex: 1,
    marginRight: 8, // spacing[4]
  },
  featuredGroupName: {
    fontSize: 13, // typography.fontSize.md
    fontWeight: '600', // typography.fontWeight.semibold
    color: '#ffffff', // colors.text.primary
    marginBottom: 4, // spacing[2]
  },
  featuredGroupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // spacing[2]
  },
  featuredGroupMetaText: {
    fontSize: 10, // typography.fontSize.xs
    color: '#888888', // colors.text.secondary
  },
  joinButton: {
    paddingVertical: 6, // spacing[3]
    paddingHorizontal: 12, // spacing[6]
    borderRadius: 6, // borderRadius.sm
    borderWidth: 1,
    borderColor: '#D9B97E', // colors.primary.gold
    backgroundColor: 'rgba(217, 185, 126, 0.08)', // colors.primary.gold8
  },
  joinButtonText: {
    fontSize: 11, // typography.fontSize.sm
    fontWeight: '600', // typography.fontWeight.semibold
    color: '#D9B97E', // colors.primary.gold
  },

  // Loading & Empty States
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48, // spacing[24]
    gap: 12, // spacing[6]
  },
  loadingText: {
    fontSize: 14, // typography.fontSize.lg
    color: '#888888', // colors.text.secondary
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48, // spacing[24]
    gap: 12, // spacing[6]
  },
  emptyText: {
    fontSize: 14, // typography.fontSize.lg
    color: '#666666', // colors.text.tertiary
    fontWeight: '500', // typography.fontWeight.medium
  },
  exploreButton: {
    marginTop: 8, // spacing[4]
    paddingVertical: 10, // spacing[5]
    paddingHorizontal: 24, // spacing[12]
    borderRadius: 8, // borderRadius.md
    borderWidth: 1.5,
    borderColor: '#D9B97E', // colors.primary.gold
    backgroundColor: 'rgba(217, 185, 126, 0.08)', // colors.primary.gold8
  },
  exploreButtonText: {
    fontSize: 14, // typography.fontSize.lg
    fontWeight: '600', // typography.fontWeight.semibold
    color: '#D9B97E', // colors.primary.gold
  },
});

export default HomeScreen;
