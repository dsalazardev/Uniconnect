import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coursesService } from "../services";
import { showToast } from "@/lib/toast";

export const useStudentCourses = () => {
  const queryClient = useQueryClient();

  // Query para obtener cursos inscritos del estudiante
  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: () => coursesService.getOwnCourses(),
  });

  // Query para obtener cursos disponibles (no inscritos)
  const availableCoursesQuery = useQuery({
    queryKey: ["available-courses"],
    queryFn: () => coursesService.getByStudent(),
    enabled: false, // Solo se carga cuando se abre el modal
  });

  const addCourseMutation = useMutation({
    mutationFn: (data: { id_course: string; status: string }) =>
      coursesService.addCourseToStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
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
      coursesService.updateCourseState(courseId, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
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
      return coursesService.deleteCourseFromStudent(courseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["my-courses"] });
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
    courses: coursesQuery.data,
    loading: coursesQuery.isLoading,
    error: coursesQuery.error,
    availableCourses: availableCoursesQuery.data,
    loadAvailableCourses: availableCoursesQuery.refetch,
    addCourse: addCourseMutation.mutate,
    isAddingCourse: addCourseMutation.isPending,
    deleteCourse: deleteCourseMutation.mutate,
    isDeletingCourse: deleteCourseMutation.isPending,
    updateCourse: updateCourseMutation.mutate,
    isUpdatingCourse: updateCourseMutation.isPending,
  };
};
