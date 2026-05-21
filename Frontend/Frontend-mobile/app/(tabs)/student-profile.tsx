import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStudentProfile } from "@/src/features/students/hooks/useStudentProfile";
import { usePerfilCompleto } from "@/src/features/students/hooks/usePerfilEstudiante";
import { authService } from "@/src/features/auth/services";
import { useResponsive } from "@/src/hooks/useResponsive";
import { useConnectionStatus } from "@/src/features/connections/hooks/useConnections";

export default function StudentProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const [vistaCompleta, setVistaCompleta] = useState(false);

  const { data: profile, isLoading, isError } = useStudentProfile(Number(id));
  const { data: perfilCompleto, isLoading: loadingCompleto, error: errorCompleto } = usePerfilCompleto(
    Number(id),
    vistaCompleta,
  );
  const {
    connectionStatus,
    isLoadingStatus,
    sendConnectionRequest,
    acceptConnectionRequest,
    rejectConnectionRequest,
    isSendingRequest,
    isAccepting,
    isRejecting,
  } = useConnectionStatus(Number(id));


  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4169e1" />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={60} color="#ff4d4d" />
        <Text style={styles.errorText}>Error al cargar el perfil</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSendConnectionRequest = () => {
    const status = connectionStatus?.status || 'none';
    if (status === 'none' || status === 'rejected') {
      sendConnectionRequest({ addressee_id: Number(id) });
    }
  };

  const getButtonConfig = () => {
    const status = connectionStatus?.status || 'none';
    const isRequester = connectionStatus?.is_requester;

    switch (status) {
      case 'accepted':
        return {
          text: 'Ya somos amigos',
          icon: 'checkmark-circle',
          disabled: true,
          textColor: '#1a1a1a',
          backgroundColor: '#D9B97E',
          showAcceptReject: false,
        };
      case 'pending':
        if (isRequester) {
          return {
            text: 'Solicitud pendiente',
            icon: 'time-outline',
            disabled: true,
            textColor: '#1a1a1a',
            backgroundColor: '#D9B97E',
            showAcceptReject: false,
          };
        }
        // is_requester === false: show accept/reject inline
        return {
          text: '',
          icon: '',
          disabled: true,
          textColor: '#1a1a1a',
          backgroundColor: '#D9B97E',
          showAcceptReject: true,
        };
      default:
        return {
          text: 'Enviar Solicitud de Conexión',
          icon: 'people-outline',
          disabled: false,
          textColor: '#1a1a1a',
          backgroundColor: '#D9B97E',
          showAcceptReject: false,
        };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <View style={styles.wrapper}>
      <View style={styles.topBackground} />
      <View style={styles.bottomBackground} />

      <ScrollView style={styles.container}>
        {/* Botón de volver */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Header Card */}
        <View style={[
          styles.headerCard,
          { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" }
        ]}>
          <View style={styles.avatarContainer}>
            {profile.picture ? (
              <Image
                source={{ uri: authService.getImageUri(profile.picture) }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={50} color="#666" />
              </View>
            )}
          </View>

          <Text style={styles.name}>{profile.full_name}</Text>
        </View>

        {/* Información del estudiante */}
        <View style={[
          styles.section,
          { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" }
        ]}>
          <Text style={styles.sectionTitle}>Información</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#fff" />
            <Text style={styles.infoText}>{profile.email || "No disponible"}</Text>
          </View>

          {profile.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#fff" />
              <Text style={styles.infoText}>{profile.phone}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={20} color="#fff" />
            <Text style={styles.infoText}>
              {profile.program || "Sin programa asignado"}
            </Text>
          </View>

          {!!profile.current_semester && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#D9B97E" />
              <Text style={[styles.infoText, styles.semesterText]}>
                Semestre {profile.current_semester}
              </Text>
            </View>
          )}
        </View>

        {/* US-D02: Botón para vista completa (Decorator pattern) */}
        <TouchableOpacity
          style={[
            styles.vistaButton,
            { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" },
            vistaCompleta && styles.vistaButtonActive,
          ]}
          onPress={() => setVistaCompleta(!vistaCompleta)}
        >
          <Ionicons name={vistaCompleta ? "stats-chart" : "stats-chart-outline"} size={16} color={vistaCompleta ? "#1a1a1a" : "#D9B97E"} />
          <Text style={[styles.vistaButtonText, vistaCompleta && styles.vistaButtonTextActive]}>
            {vistaCompleta ? 'Ver perfil base' : 'Ver perfil completo'}
          </Text>
        </TouchableOpacity>

        {/* US-D02: Secciones del perfil completo */}
        {vistaCompleta && loadingCompleto && (
          <ActivityIndicator size="small" color="#D9B97E" style={{ marginBottom: 15 }} />
        )}

        {vistaCompleta && !!errorCompleto && (
          <View style={[styles.section, { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" }]}>
            <Text style={{ color: '#ef4444', fontSize: 13 }}>
              Error al cargar el perfil completo: {errorCompleto}
            </Text>
          </View>
        )}

        {vistaCompleta && perfilCompleto && (
          <>
            {/* Estadísticas (CA #2) */}
            <View style={[styles.section, { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" }]}>
              <Text style={styles.sectionTitle}>📊 Estadísticas</Text>
              {[
                { label: 'Grupos creados', value: perfilCompleto.estadisticas.gruposCreados },
                { label: 'Grupos en los que participa', value: perfilCompleto.estadisticas.gruposParticipa },
                { label: 'Mensajes enviados', value: perfilCompleto.estadisticas.mensajesEnviados },
              ].map((item) => (
                <View style={styles.statRow} key={item.label}>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={styles.statValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Insignias (CA #3) */}
            <View style={[styles.section, { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" }]}>
              <Text style={styles.sectionTitle}>🏅 Insignias</Text>
              {perfilCompleto.insignias.length === 0 ? (
                <Text style={styles.subtitle}>Aún no hay insignias desbloqueadas. ¡Sigue participando!</Text>
              ) : (
                <View style={styles.insigniasGrid}>
                  {perfilCompleto.insignias.map((insignia) => (
                    <View style={styles.insigniaCard} key={insignia.id}>
                      <Text style={styles.insigniaIcono}>{insignia.icono}</Text>
                      <Text style={styles.insigniaNombre}>{insignia.nombre}</Text>
                      <Text style={styles.insigniaDesc}>{insignia.descripcion}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Materias en Común */}
        {profile.common_courses && profile.common_courses.length > 0 && (
          <View style={[
            styles.section,
            { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" }
          ]}>
            <Text style={styles.sectionTitle}>Materias en Común</Text>
            <Text style={styles.subtitle}>
              {profile.common_courses.length} {profile.common_courses.length === 1 ? 'materia' : 'materias'} compartidas
            </Text>

            {profile.common_courses.map((course: any) => (
              <View style={styles.courseItem} key={course.id_course}>
                <View style={styles.courseDot} />
                <View style={styles.courseTextContainer}>
                  <Text style={styles.courseName}>{course.name}</Text>
                  {course.schedule && (
                    <Text style={styles.courseSchedule}>{course.schedule}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Botón de Conexión */}
        {buttonConfig.showAcceptReject ? (
          <View style={[
            styles.acceptRejectContainer,
            { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" }
          ]}>
            <TouchableOpacity
              style={[styles.acceptButton, isAccepting && styles.connectionButtonDisabled]}
              onPress={() => acceptConnectionRequest(connectionStatus!.id_connection!)}
              disabled={isAccepting || isRejecting}
              activeOpacity={0.8}
            >
              {isAccepting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.acceptButtonText}>Aceptar solicitud</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectButton, isRejecting && styles.connectionButtonDisabled]}
              onPress={() => rejectConnectionRequest(connectionStatus!.id_connection!)}
              disabled={isAccepting || isRejecting}
              activeOpacity={0.8}
            >
              {isRejecting
                ? <ActivityIndicator size="small" color="#666" />
                : <Text style={styles.rejectButtonText}>Rechazar</Text>
              }
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.connectionButton,
              {
                width: isDesktop ? "40%" : isTablet ? "40%" : "80%",
                backgroundColor: buttonConfig.backgroundColor
              },
              (isSendingRequest || buttonConfig.disabled) && styles.connectionButtonDisabled
            ]}
            onPress={handleSendConnectionRequest}
            activeOpacity={0.8}
            disabled={isSendingRequest || buttonConfig.disabled}
          >
            {isSendingRequest ? (
              <ActivityIndicator size="small" color="#1a1a1a" />
            ) : (
              <>
                <Ionicons name={buttonConfig.icon as any} size={20} color={buttonConfig.textColor} style={styles.buttonIcon} />
                <Text style={[styles.connectionButtonText, { color: buttonConfig.textColor }]}>{buttonConfig.text}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  topBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "35%",
    backgroundColor: "#363636",
  },
  bottomBackground: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#363636",
  },
  container: { flex: 1 },
  backButton: {
    position: "absolute",
    top: 40,
    left: 15,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 8,
  },
  headerCard: {
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    marginTop: 75,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 30,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 30,
    alignItems: "center",
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#D9B97E",
  },
  avatarContainer: {
    position: "absolute",
    top: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#D9B97E",
  },
  avatarPlaceholder: {
    backgroundColor: "#4a4a4a",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
    textAlign: "center",
  },
  role: {
    fontSize: 16,
    color: "#aaa",
  },
  section: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 20,
    padding: 20,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(217, 185, 126, 0.3)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 13,
    color: "#aaa",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    marginLeft: 12,
  },
  semesterText: {
    color: "#D9B97E",
    fontWeight: "600",
  },
  courseItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  courseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9B97E",
    marginRight: 12,
  },
  courseTextContainer: { flex: 1 },
  courseName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 2,
  },
  courseSchedule: {
    fontSize: 12,
    color: "#aaa",
  },
  connectionButton: {
    backgroundColor: "#D9B97E",
    marginHorizontal: 15,
    marginBottom: 30,
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  connectionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#363636",
  },
  errorText: {
    color: "#fff",
    marginTop: 10,
  },
  backLink: {
    color: "#D9B97E",
    marginTop: 10,
    fontSize: 16,
  },
  connectionButtonDisabled: {
    opacity: 0.6,
  },
  acceptRejectContainer: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 15,
    marginBottom: 30,
    marginTop: 10,
    alignSelf: 'center',
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#666',
    flexDirection: 'row',
  },
  rejectButtonText: {
    color: '#aaa',
    fontWeight: '600',
    fontSize: 14,
  },
  // US-D02: Decorator styles
  vistaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D9B97E',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 15,
    marginBottom: 12,
    alignSelf: 'center',
  },
  vistaButtonActive: {
    backgroundColor: '#D9B97E',
    borderColor: '#D9B97E',
  },
  vistaButtonText: {
    color: '#D9B97E',
    fontWeight: '600',
    fontSize: 14,
  },
  vistaButtonTextActive: {
    color: '#1a1a1a',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 14,
  },
  statValue: {
    color: '#D9B97E',
    fontWeight: '700',
    fontSize: 16,
  },
  insigniasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  insigniaCard: {
    backgroundColor: 'rgba(217,185,126,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217,185,126,0.25)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 110,
    flex: 1,
  },
  insigniaIcono: {
    fontSize: 26,
    marginBottom: 4,
  },
  insigniaNombre: {
    color: '#D9B97E',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  insigniaDesc: {
    color: '#9ca3af',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
});