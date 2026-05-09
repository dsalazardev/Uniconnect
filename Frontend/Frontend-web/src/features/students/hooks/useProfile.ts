import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authStore } from "../../auth/store/AuthStore";
import { studentsService } from "../services";
import { coursesService } from "@/features/courses/services";
import type { UpdateProfileData } from '@uniconnect/shared';
import { showToast } from "@/lib/toast";


export function useProfile() {
  const queryClient = useQueryClient();

  // Query para obtener perfil
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => studentsService.getProfile(),
  });

  // Query para obtener cursos del usuario (solo inscritos)
  const coursesQuery = useQuery({
    queryKey: ['my-courses'],
    queryFn: () => coursesService.getOwnCourses(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => studentsService.updateProfile(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      if (data.picture && authStore.user) {
        // Update the user in AuthStore
        authStore.updateUser({ ...authStore.user, picture: data.picture });
      }
      showToast.success("Perfil actualizado", "Los cambios se guardaron correctamente");
    },
    onError: (error) => {
      console.error("Error al actualizar perfil:", error);
      showToast.error("Error", "No se pudieron guardar los cambios");
    },
  });

  return {
    profile: profileQuery.data,
    courses: coursesQuery.data,
    isLoading: profileQuery.isLoading || coursesQuery.isLoading,
    isError: profileQuery.isError || coursesQuery.isError,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
}