import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { courseService } from "@/src/features/courses/services/courses.service";
import { Course } from "@/src/features/courses/types";
import { showToast } from "@/src/lib/toast";

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (groupData: {
    name: string;
    description: string;
    id_course: number;
  }) => void;
}

export const CreateGroupModal = ({
  visible,
  onClose,
  onSave,
}: CreateGroupModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // Obtener cursos disponibles
  const { data: courses, isLoading: loadingCourses } = useQuery<Course[]>({
    queryKey: ["owner-active-courses"],
    queryFn: courseService.getOwnActiveCourses,
    enabled: visible,
  });

  const handleSave = () => {
    if (!name.trim()) {
      showToast.error("Error", "El nombre del grupo es obligatorio");
      return;
    }

    if (!description.trim()) {
      showToast.error("Error", "La descripción del grupo es obligatoria");
      return;
    }

    if (!selectedCourseId) {
      showToast.error("Error", "Debes seleccionar un curso");
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      id_course: selectedCourseId,
    });

    handleClose();
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedCourseId(null);
    setShowCourseDropdown(false);
    onClose();
  };

  const selectCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
    setShowCourseDropdown(false);
  };

  const selectedCourse = courses?.find((c: Course) => c.id_course === selectedCourseId);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Crear Grupo de Estudio</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {/* Nombre del grupo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del grupo *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej: Grupo de Cálculo"
                placeholderTextColor="#999"
              />
            </View>

            {/* Descripción */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe el propósito del grupo..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Selector de curso */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Curso *</Text>
              {loadingCourses ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Cargando cursos...</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowCourseDropdown(!showCourseDropdown)}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        !selectedCourse && styles.placeholder,
                      ]}
                    >
                      {selectedCourse?.name || "Selecciona un curso"}
                    </Text>
                    <Ionicons
                      name={showCourseDropdown ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>

                  {showCourseDropdown && (
                    <View style={styles.dropdownList}>
                      <ScrollView style={styles.dropdownScroll}>
                        {courses && courses.length > 0 ? (
                          courses.map((course: Course) => (
                            <TouchableOpacity
                              key={course.id_course}
                              style={styles.dropdownItem}
                              onPress={() => selectCourse(course.id_course)}
                            >
                              <Text style={styles.dropdownItemText}>
                                {course.name}
                              </Text>
                              {selectedCourseId === course.id_course && (
                                <Ionicons
                                  name="checkmark"
                                  size={20}
                                  color="#007AFF"
                                />
                              )}
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={styles.emptyText}>
                            No hay cursos disponibles
                          </Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Crear Grupo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "85%",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D9B97E",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217, 185, 126, 0.3)",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  body: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D9B97E",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#fff",
    backgroundColor: "#2a2a2a",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9B97E",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#2a2a2a",
  },
  dropdownText: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
  },
  placeholder: {
    color: "#888",
  },
  dropdownList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D9B97E",
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    maxHeight: 200,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(217, 185, 126, 0.2)",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#aaa",
  },
  emptyText: {
    padding: 20,
    textAlign: "center",
    color: "#888",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(217, 185, 126, 0.3)",
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(217, 185, 126, 0.3)",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#D9B97E",
  },
  saveButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
  },
});