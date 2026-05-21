import React, { useCallback, useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Student, CommonCourse } from "../types";
import { authService } from "../../auth/services";

interface StudentCardProps {
  student: Student;
  isFriend?: boolean;
  onOpenDirectMessage?: (userId: number) => Promise<void>;
}

export const StudentCard = ({ student, isFriend = false, onOpenDirectMessage }: StudentCardProps) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  const commonCourses = React.useMemo<CommonCourse[]>(() => {
    const raw = (student as any).common_courses
      ?? (student as any).commonCourses
      ?? (student as any).common_subjects
      ?? (student as any).commonSubjects
      ?? (student as any).courses_in_common
      ?? (student as any).coursesInCommon
      ?? [];

    if (!Array.isArray(raw)) {
      return [];
    }

    const normalized = raw
      .map((course: any, index: number) => {
        if (typeof course === 'string') {
          return {
            id_course: index + 1,
            name: course,
          };
        }

        if (typeof course !== 'object' || !course) return null;

        const nested = course?.course;
        const id_course = course?.id_course ?? nested?.id_course ?? index + 1;
        const name = course?.name ?? nested?.name;

        if (!name) return null;

        return {
          id_course,
          name,
        };
      })
      .filter((item): item is CommonCourse => Boolean(item));

    return normalized;
  }, [student]);

  const handlePress = useCallback(async () => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    try {
      router.push(`/(tabs)/student-profile?id=${student.id_user}`);
    } finally {
      setIsNavigating(false);
    }
  }, [student.id_user, router, isNavigating]);

  const handleOpenChat = useCallback(async (e: React.BaseSyntheticEvent) => {
    e.stopPropagation();
    if (isOpeningChat || !onOpenDirectMessage) return;
    
    setIsOpeningChat(true);
    try {
      await onOpenDirectMessage(student.id_user);
    } finally {
      setIsOpeningChat(false);
    }
  }, [student.id_user, onOpenDirectMessage, isOpeningChat]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isNavigating}
    >
      <Image
        source={{
          uri:
            authService.getImageUri(student.picture) ||
            "https://via.placeholder.com/50",
        }}
        style={styles.avatar}
      />

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{student.full_name}</Text>

        <View style={styles.programRow}>
          <Text style={styles.program}>
            {student.program?.name || "Programa no asignado"}
          </Text>
          {!!student.current_semester && (
            <Text style={styles.semester}>• Semestre {student.current_semester}</Text>
          )}
        </View>

        {commonCourses.length > 0 ? (
          <View style={styles.badgeContainer}>
            {commonCourses.map((course) => (
              <View key={`${course.id_course}-${course.name}`} style={styles.badge}>
                <Text style={styles.badgeText}>{course.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noCourses}>Sin materias en común</Text>
        )}
      </View>

      {isFriend && onOpenDirectMessage && (
        <TouchableOpacity
          style={styles.messageButton}
          onPress={handleOpenChat}
          disabled={isOpeningChat}
          activeOpacity={0.7}
        >
          {isOpeningChat ? (
            <ActivityIndicator size="small" color="#D9B97E" />
          ) : (
            <Ionicons name="chatbubble-outline" size={24} color="#D9B97E" />
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    marginHorizontal: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    borderWidth: 1,
    borderColor: "rgba(217, 185, 126, 0.3)",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4a4a4a",
    borderWidth: 2,
    borderColor: "#D9B97E",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  programRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  program: {
    fontSize: 13,
    color: "#aaa",
  },
  semester: {
    fontSize: 13,
    color: "#D9B97E",
    marginLeft: 6,
    fontWeight: "600",
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    backgroundColor: "rgba(217, 185, 126, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D9B97E",
  },
  badgeText: {
    fontSize: 11,
    color: "#D9B97E",
    fontWeight: "600",
  },
  noCourses: {
    fontSize: 11,
    color: "#888",
    fontStyle: "italic",
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(217, 185, 126, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 185, 126, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});