import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { courseService } from "../services/courses.service";
import { Course } from "../types";
import { Ionicons } from "@expo/vector-icons";
import { useStudentCourses } from "../hooks/useStudentCourses";
import { showToast } from "@/src/lib/toast";

interface NewCourseModal {
  visible: boolean;
  onClose: () => void;
  onSave: (courseData: { id_course: string; status: string }) => void;
}

export const NewCourseModal = ({
  visible,
  onClose,
  onSave,
}: NewCourseModal) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedState, setSelectedState] = useState<string>("active");
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses-by-student"],
    queryFn: courseService.getByStudent,
    enabled: visible,
  });

  const { addCourse, isAddingCourse } = useStudentCourses();

  const states = [
    { value: "active", label: "En curso" },
    { value: "finished", label: "Finalizado" },
  ];

  const handleSave = () => {
    if (!selectedCourse) {
      showToast.error("Error", "Por favor selecciona un curso");
      return;
    }

    const courseData = {
      id_course: selectedCourse.id_course.toString(),
      status: selectedState,
    };

    addCourse(courseData, {
      onSuccess: () => {
        onSave(courseData);
        handleClose();
      },
    });
  };

  const handleClose = () => {
    setSelectedCourse(null);
    setSelectedState("active");
    setShowCourseDropdown(false);
    setShowStateDropdown(false);
    onClose();
  };

  const selectCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseDropdown(false);
  };

  const selectState = (status: string) => {
    setSelectedState(status);
    setShowStateDropdown(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Nuevo Curso</Text>

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#007AFF"
              style={styles.loader}
            />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Selector de Curso */}
              <Text style={styles.label}>Selecciona un curso *</Text>
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
                  <ScrollView style={styles.flatList}>
                    {courses?.map((item: Course) => (
                      <TouchableOpacity
                        key={item.id_course.toString()}
                        style={styles.dropdownItem}
                        onPress={() => selectCourse(item)}
                      >
                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                        {selectedCourse?.id_course === item.id_course && (
                          <Ionicons name="checkmark" size={20} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Selector de Estado */}
              <Text style={[styles.label, { marginTop: 15 }]}>
                Estado del curso *
              </Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowStateDropdown(!showStateDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {states.find((s) => s.value === selectedState)?.label}
                </Text>
                <Ionicons
                  name={showStateDropdown ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>

              {showStateDropdown && (
                <View style={styles.dropdownList}>
                  {states.map((state) => (
                    <TouchableOpacity
                      key={state.value}
                      style={styles.dropdownItem}
                      onPress={() => selectState(state.value)}
                    >
                      <Text style={styles.dropdownItemText}>{state.label}</Text>
                      {selectedState === state.value && (
                        <Ionicons name="checkmark" size={20} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isAddingCourse}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                isAddingCourse && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={isLoading || isAddingCourse}
            >
              {isAddingCourse ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
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
    maxWidth: 400,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#D9B97E",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#fff",
  },
  loader: {
    marginVertical: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#fff",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9B97E",
    borderRadius: 10,
    padding: 15,
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
    marginTop: 5,
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
  flatList: {
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
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
  disabledButton: {
    opacity: 0.6,
  }
});