import { authStore } from "@/src/features/auth";
import { useResponsive } from "@/src/hooks/useResponsive";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { authService } from "@/src/features/auth/services";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useProfile } from "@/src/features/students/hooks/useProfile";
import { usePerfilCompleto } from "@/src/features/students/hooks/usePerfilEstudiante";
import { NewCourseModal } from "@/src/features/courses/components/NewCourse";
import { useStudentCourses } from "@/src/features/courses/hooks/useStudentCourses";
import { EditCourseModal } from "@/src/features/courses/components/EditCourse";
import { showToast } from "@/src/lib/toast";

export default function ProfileScreen() {
  const user = authStore.user;
  const router = useRouter();
  const { isDesktop, isTablet } = useResponsive();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [vistaCompleta, setVistaCompleta] = useState(false);
  const { profile, isLoading, isError, updateProfile, isUpdatingProfile } = useProfile();
  const currentUserId = user?.id_user ?? 0;
  const { data: perfilCompleto, isLoading: loadingCompleto, error: errorCompleto } =
    usePerfilCompleto(currentUserId, vistaCompleta);
  const { deleteCourse, isDeletingCourse, updateCourse, isUpdatingCourse } = useStudentCourses();

  const [phone, setPhone] = useState(profile?.phone || "");
  const [program, setProgram] = useState(profile?.program || "");
  const [semester, setSemester] = useState(profile?.current_semester || "");
  const [profileImage, setProfileImage] = useState(profile?.picture || "");
  const [courses, setCourses] = useState<Array<{ id_course: number; name: string; state?: string }>>(profile?.courses || []);

  useEffect(() => {
    if (profile) {
      setPhone(profile.phone || "");
      setProgram(profile.program || "");
      setSemester(profile.current_semester || "");
      setProfileImage(profile.picture || "");
      setCourses(profile.courses || []);
    }
  }, [profile]);

  const handleAddCourse = () => {
    setAddModalVisible(true);
  };

  const handleSaveNewCourse = (courseData: {
    id_course: string;
    status: string;
  }) => {
    setAddModalVisible(false);
  };

  const handleDeleteCourse = (courseId: number, courseName: string) => {
    deleteCourse(courseId);
  };

  const handleEditCourse = (courseId: number) => {
    const course = courses.find((c) => c.id_course === courseId);
    if (course) {
      setSelectedCourse(course);
      setEditModalVisible(true);
    }
  };

  const handleUpdateCourse = (newState: string) => {
    if (selectedCourse) {
      updateCourse(
        { courseId: selectedCourse.id_course, state: newState },
        {
          onSuccess: () => {
            setEditModalVisible(false);
            setSelectedCourse(null);
          },
        }
      );
    }
  };

  const handleSaveChanges = () => {
    updateProfile({
      phone,
      current_semester: semester ? semester : "0",
      image: profileImage,
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      showToast.error("Permiso denegado", "Necesitamos permisos para acceder a tus fotos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      try {
        const base64WithPrefix = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setProfileImage(base64WithPrefix);
      } catch (error) {
        showToast.error("Error", "No se pudo procesar la imagen");
      }
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.wrapper,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#D9B97E" />
        <Text style={{ color: "#fff", marginTop: 10 }}>Cargando perfil...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View
        style={[
          styles.wrapper,
          { justifyContent: "center", alignItems: "center", padding: 20 },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={60} color="#ff4d4d" />
        <Text style={{ color: "#fff", marginTop: 10, textAlign: "center" }}>
          Error al cargar el perfil
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container}>
        {/* Botón de volver */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View
          style={[
            styles.headerCard,
            { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" },
          ]}
        >
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {profileImage ? (
              <Image
                source={{ uri: authService.getImageUri(profileImage) }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={50} color="#666" />
              </View>
            )}

            {/* Ícono de subir imagen */}
            <View style={styles.uploadIconContainer}>
              <Ionicons name="cloud-upload" size={20} color="#1a1a1a" />
            </View>
          </TouchableOpacity>

          <Text style={styles.name}>
            {profile?.full_name || "Nombre no disponible"}
          </Text>
        </View>

        {/* About You */}
        <View
          style={[
            styles.section,
            { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" },
          ]}
        >
          <Text style={styles.sectionTitle}>Sobre ti</Text>

          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#fff" />
            <Text style={styles.infoText}>{user?.email || ""}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#fff" />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.infoInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Ingresa tu teléfono"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
              />
              <Ionicons name="create-outline" size={16} color="#D9B97E" />
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={20} color="#fff" />
            <Text style={styles.infoText}>
              {profile?.program || "Sin programa asignado"}
            </Text>
          </View>
        </View>

        {/* Academic Status */}
        <View
          style={[
            styles.section,
            { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" },
          ]}
        >
          <Text style={styles.sectionTitle}>Estado Académico</Text>
          <View style={styles.spaceBetween}>
            <Text style={styles.sectionSemiTitle}>Progreso actual</Text>
            <Text style={[styles.sectionSemiTitle, { fontWeight: "bold" }]}>
              {profile?.progress || 0}%
            </Text>
          </View>

          {/* Contenedor de la barra */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${profile?.progress || 0}%` },
                ]}
              />
            </View>
          </View>

          <View style={[styles.spaceBetween, { marginTop: 20 }]}>
            <Text style={styles.sectionSemiTitle}>Semestre actual</Text>
            <View style={styles.semesterInputContainer}>
              <TextInput
                style={styles.semesterInput}
                value={semester}
                onChangeText={setSemester}
                placeholder="0"
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
              <Ionicons name="create-outline" size={14} color="#D9B97E" style={{ marginLeft: 4 }} />
            </View>
          </View>

          {/*My Courses*/}
          <View style={[styles.section, { width: "100%" }]}>
            <View style={[styles.spaceBetween]}>
              <Text style={styles.sectionTitle}>Mis Cursos</Text>
              <TouchableOpacity
                onPress={handleAddCourse}
                style={{ marginBottom: 10 }}
              >
                <Ionicons name="add-circle-outline" size={28} color="#D9B97E" />
              </TouchableOpacity>
            </View>

            {/* Lista de cursos */}
            {courses && courses.length > 0 ? (
              courses.map((course: { id_course: number; name: string; state?: string }) => (
                <View style={styles.courseItem} key={course.id_course}>
                  <View style={styles.courseInfo}>
                    <View style={styles.courseDot} />
                    <View style={styles.courseTextContainer}>
                      <Text style={styles.courseName}>{course.name}</Text>
                      <Text style={styles.courseState}>{course.state}</Text>
                    </View>
                  </View>

                  <View style={styles.courseActions}>
                    <TouchableOpacity
                      onPress={() => handleEditCourse(course.id_course)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="create-outline" size={22} color="#D9B97E" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteCourse(course.id_course, course.name)
                      }
                      style={styles.actionButton}
                      disabled={isDeletingCourse}
                    >
                      {isDeletingCourse ? (
                        <ActivityIndicator size="small" color="#ff4d4d" />
                      ) : (
                        <Ionicons
                          name="trash-outline"
                          size={22}
                          color="#ff4d4d"
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text
                style={{ color: "#aaa", textAlign: "center", marginTop: 10 }}
              >
                No tienes cursos registrados
              </Text>
            )}
          </View>
        </View>

        {/* US-D02: Estadísticas e Insignias (Decorator) */}
        <TouchableOpacity
          style={[
            profileStyles.vistaButton,
            { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" },
            vistaCompleta && profileStyles.vistaButtonActive,
          ]}
          onPress={() => setVistaCompleta(!vistaCompleta)}
        >
          <Ionicons
            name={vistaCompleta ? "stats-chart" : "stats-chart-outline"}
            size={16}
            color={vistaCompleta ? "#1a1a1a" : "#D9B97E"}
          />
          <Text style={[profileStyles.vistaButtonText, vistaCompleta && profileStyles.vistaButtonTextActive]}>
            {vistaCompleta ? "Ocultar estadísticas" : "Ver estadísticas e insignias"}
          </Text>
        </TouchableOpacity>

        {vistaCompleta && loadingCompleto && (
          <ActivityIndicator size="small" color="#D9B97E" style={{ marginBottom: 12 }} />
        )}

        {vistaCompleta && !!errorCompleto && (
          <View style={[profileStyles.decoratorSection, { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" }]}>
            <Text style={{ color: "#ef4444", fontSize: 13 }}>Error: {errorCompleto}</Text>
          </View>
        )}

        {vistaCompleta && perfilCompleto && (
          <>
            <View style={[profileStyles.decoratorSection, { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" }]}>
              <Text style={profileStyles.decoratorTitle}>📊 Estadísticas</Text>
              {[
                { label: "Grupos creados", value: perfilCompleto.estadisticas.gruposCreados },
                { label: "Grupos en los que participo", value: perfilCompleto.estadisticas.gruposParticipa },
                { label: "Mensajes enviados", value: perfilCompleto.estadisticas.mensajesEnviados },
              ].map((item) => (
                <View style={profileStyles.statRow} key={item.label}>
                  <Text style={profileStyles.statLabel}>{item.label}</Text>
                  <Text style={profileStyles.statValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            <View style={[profileStyles.decoratorSection, { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" }]}>
              <Text style={profileStyles.decoratorTitle}>🏅 Mis Insignias</Text>
              {perfilCompleto.insignias.length === 0 ? (
                <Text style={{ color: "#9ca3af", fontSize: 13 }}>Aún no hay insignias desbloqueadas. ¡Sigue participando!</Text>
              ) : (
                <View style={profileStyles.insigniasGrid}>
                  {perfilCompleto.insignias.map((ins) => (
                    <View style={profileStyles.insigniaCard} key={ins.id}>
                      <Text style={profileStyles.insigniaIcono}>{ins.icono}</Text>
                      <Text style={profileStyles.insigniaNombre}>{ins.nombre}</Text>
                      <Text style={profileStyles.insigniaDesc}>{ins.descripcion}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* Botón Guardar Cambios */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { width: isDesktop ? "40%" : isTablet ? "40%" : "80%" },
            isUpdatingProfile && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveChanges}
          disabled={isUpdatingProfile}
          activeOpacity={0.8}
        >
          {isUpdatingProfile ? (
            <ActivityIndicator size="small" color="#1a1a1a" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <NewCourseModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleSaveNewCourse}
      />
      <EditCourseModal
        visible={editModalVisible}
        courseName={selectedCourse?.name || ""}
        currentState={selectedCourse?.state || "active"}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedCourse(null);
        }}
        onSave={handleUpdateCourse}
        isLoading={isUpdatingCourse}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#363636", 
  },
  container: {
    flex: 1,
  },
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
  uploadIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#D9B97E",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#D9B97E",
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
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(217, 185, 126, 0.3)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  sectionSemiTitle: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    marginLeft: 12,
  },
  inputContainer: {
    marginLeft: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D9B97E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
    maxWidth: 250,
  },
  infoInput: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    padding: 0,
    marginRight: 8,
  },
  semesterInputContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D9B97E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  semesterInput: {
    fontSize: 14,
    color: '#fff',
    padding: 0,
    textAlign: 'center',
    minWidth: 60,
  },
  spaceBetween: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressBar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressBarContainer: {
    marginTop: 5,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#D9B97E",
    borderRadius: 4,
  },
  courseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  courseInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  courseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9B97E",
    marginRight: 12,
  },
  courseTextContainer: {
    flex: 1,
  },
  courseName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 4,
  },
  courseState: {
    fontSize: 12,
    color: "#aaa",
  },
  saveButton: {
    backgroundColor: "#D9B97E",
    marginHorizontal: 15,
    marginBottom: 30,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  courseActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
});

const profileStyles = StyleSheet.create({
  vistaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: '#D9B97E', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 16,
    marginHorizontal: 15, marginBottom: 12, alignSelf: 'center',
  },
  vistaButtonActive: { backgroundColor: '#D9B97E' },
  vistaButtonText: { color: '#D9B97E', fontWeight: '600', fontSize: 14 },
  vistaButtonTextActive: { color: '#1a1a1a' },
  decoratorSection: {
    backgroundColor: 'rgba(26,26,26,0.9)', marginHorizontal: 15, marginBottom: 12,
    borderRadius: 16, padding: 16, alignSelf: 'center',
    borderWidth: 1, borderColor: 'rgba(217,185,126,0.2)',
  },
  decoratorTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  statLabel: { color: '#aaa', fontSize: 14 },
  statValue: { color: '#D9B97E', fontWeight: '700', fontSize: 16 },
  insigniasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  insigniaCard: {
    backgroundColor: 'rgba(217,185,126,0.08)', borderWidth: 1,
    borderColor: 'rgba(217,185,126,0.2)', borderRadius: 10,
    padding: 10, alignItems: 'center', minWidth: 100, flex: 1,
  },
  insigniaIcono: { fontSize: 24, marginBottom: 4 },
  insigniaNombre: { color: '#D9B97E', fontWeight: '700', fontSize: 11, textAlign: 'center', marginBottom: 2 },
  insigniaDesc: { color: '#9ca3af', fontSize: 10, textAlign: 'center', lineHeight: 13 },
});