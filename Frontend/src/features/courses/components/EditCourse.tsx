import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EditCourseModalProps {
  visible: boolean;
  courseName: string;
  currentState: string;
  onClose: () => void;
  onSave: (newState: string) => void;
  isLoading?: boolean;
}

export const EditCourseModal = ({
  visible,
  courseName,
  currentState,
  onClose,
  onSave,
  isLoading = false,
}: EditCourseModalProps) => {
  const [selectedState, setSelectedState] = useState(currentState);

  useEffect(() => {
    setSelectedState(currentState);
  }, [currentState, visible]);

  const states = [
    { value: "active", label: "En curso" },
    { value: "finished", label: "Finalizado" },
  ];

  const handleSave = () => {
    onSave(selectedState);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Editar Estado</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#D9B97E" />
            </TouchableOpacity>
          </View>

          <Text style={styles.courseName}>{courseName}</Text>

          <Text style={styles.label}>Selecciona el nuevo estado:</Text>

          {states.map((state) => (
            <TouchableOpacity
              key={state.value}
              style={[
                styles.stateOption,
                selectedState === state.value && styles.stateOptionSelected,
              ]}
              onPress={() => setSelectedState(state.value)}
            >
              <View style={styles.stateOptionContent}>
                <Text
                  style={[
                    styles.stateOptionText,
                    selectedState === state.value &&
                      styles.stateOptionTextSelected,
                  ]}
                >
                  {state.label}
                </Text>
                {selectedState === state.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
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
    borderWidth: 1,
    borderColor: "#D9B97E",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  courseName: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 20,
    fontWeight: "500",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    color: "#fff",
  },
  stateOption: {
    borderWidth: 2,
    borderColor: "rgba(217, 185, 126, 0.3)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    backgroundColor: "#2a2a2a",
  },
  stateOptionSelected: {
    borderColor: "#D9B97E",
    backgroundColor: "rgba(217, 185, 126, 0.2)",
  },
  stateOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stateOptionText: {
    fontSize: 16,
    color: "#fff",
  },
  stateOptionTextSelected: {
    fontWeight: "600",
    color: "#D9B97E",
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
  },
});