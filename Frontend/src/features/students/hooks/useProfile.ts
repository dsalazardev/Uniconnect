import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authStore } from "../../auth";
import { studentService } from "../services/student.service";
import { UpdateProfileData } from "../types";
import FlashMessage, { showMessage } from "react-native-flash-message";
import { showToast } from "@/src/lib/toast";


export function useProfile() {
  const token = authStore.accessToken;
  const queryClient = useQueryClient();

  // Query para obtener perfil
  const profileQuery = useQuery({
    queryKey: ['profile', token],
    queryFn: () => studentService.getProfile(token!),
    enabled: !!token,
  });

  // Query para obtener cursos
  const coursesQuery = useQuery({
    queryKey: ['courses', token],
    queryFn: () => studentService.getCourses(),
    enabled: !!token,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => studentService.updateProfile(data, token!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (data.picture) {
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