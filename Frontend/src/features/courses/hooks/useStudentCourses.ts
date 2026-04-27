import { useMutation, useQueryClient } from "@tanstack/react-query";
import { courseService } from "../services/courses.service";
import { Alert } from "react-native";
import { showToast } from "@/src/lib/toast";

export const useStudentCourses = () => {
  const queryClient = useQueryClient();

  const addCourseMutation = useMutation({
    mutationFn: (data: { id_course: string; status: string }) =>
      courseService.addCourseToStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      showToast.success("Éxito", "Curso agregado correctamente");
    },
    onError: (error: any) => {
      console.error("Error al agregar curso:", error);
      showToast.error(
        "Error",
        error.response?.data?.message || "No se pudo agregar el curso"
      );
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ courseId, state }: { courseId: number; state: string }) =>
      courseService.updateCourseState(courseId, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      showToast.success("Éxito", "Estado del curso actualizado correctamente");
    },
    onError: (error: any) => {
      console.error("Error al actualizar curso:", error);
      showToast.error(
        "Error",
        error.response?.data?.message || "No se pudo actualizar el curso"
      );
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (courseId: number) => {
      return courseService.deleteCourseFromStudent(courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      showToast.success("Éxito", "Curso eliminado correctamente");
    },
    onError: (error: any) => {
      console.error("Error al eliminar curso:", error);
      showToast.error(
        "Error",
        error.response?.data?.message || "No se pudo eliminar el curso"
      );
    },
  });

  return {
    addCourse: addCourseMutation.mutate,
    isAddingCourse: addCourseMutation.isPending,
    deleteCourse: deleteCourseMutation.mutate,
    isDeletingCourse: deleteCourseMutation.isPending,
    updateCourse: updateCourseMutation.mutate,
    isUpdatingCourse: updateCourseMutation.isPending,
  };
};