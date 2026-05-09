import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../store/AuthStore';
import { useProfile } from '@/features/students/hooks/useProfile';
import { useStudentCourses } from '@/features/courses/hooks/useStudentCourses';
import { AddCourseModal } from '@/features/courses/components/AddCourseModal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { AlertTriangle, User, Edit3, X, BookOpen, Plus, Trash2, ChevronDown } from 'lucide-react';
import type { UpdateProfileData } from '@uniconnect/shared';
import styles from './ProfileScreen.module.css';

export const ProfileScreen: React.FC = observer(() => {
  const user = authStore.user;
  const { profile, courses, isLoading, isError, updateProfile, isUpdatingProfile } = useProfile();
  const {
    deleteCourse,
    isDeletingCourse,
    updateCourse,
    isUpdatingCourse,
    addCourse,
    isAddingCourse,
    availableCourses,
    loadAvailableCourses,
  } = useStudentCourses();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addCourseModalVisible, setAddCourseModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const handleOpenEdit = () => {
    setPhone(profile?.phone || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    const data: UpdateProfileData = {};
    if (phone !== profile?.phone) data.phone = phone;
    if (Object.keys(data).length > 0) {
      updateProfile(data);
    }
    setEditModalVisible(false);
  };

  if (isLoading && !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError && !user) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <AlertTriangle size={48} className={styles.errorIcon} />
          <p className={styles.errorText}>Error al cargar el perfil</p>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user?.full_name || 'Usuario';
  const displayEmail = profile?.email || user?.email || '';
  const displayPicture = profile?.picture || user?.picture || '';
  const displayProgram = profile?.program || (user?.id_program ? `ID ${user.id_program}` : null);
  const displaySemester = profile?.current_semester ?? null;
  const displayPhone = profile?.phone ?? '';
  const displayRole = profile?.roleName || user?.role?.name || user?.roleName || 'N/A';
  const displayCourses = (courses || profile?.courses || []) as Array<any>;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          {displayPicture ? (
            <img src={displayPicture} alt={displayName} className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <User size={48} className={styles.avatarIcon} />
            </div>
          )}
          <h1 className={styles.name}>{displayName}</h1>
          <p className={styles.email}>{displayEmail}</p>
        </div>

        {/* Info Sections */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Información Académica</h2>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Rol:</span>
            <span className={styles.infoValue}>{displayRole}</span>
          </div>
          {displayProgram && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Programa:</span>
              <span className={styles.infoValue}>{displayProgram}</span>
            </div>
          )}
          {displaySemester && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Semestre:</span>
              <span className={styles.infoValue}>{displaySemester}</span>
            </div>
          )}
          {displayPhone && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Teléfono:</span>
              <span className={styles.infoValue}>{displayPhone}</span>
            </div>
          )}
        </div>

        {/* Courses */}
        <div className={styles.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className={styles.sectionTitle}>Mis Cursos</h2>
            <button
              className={styles.addCourseButton}
              onClick={() => {
                loadAvailableCourses();
                setAddCourseModalVisible(true);
              }}
            >
              <Plus size={16} />
              Agregar
            </button>
          </div>
          {displayCourses.length > 0 ? (
            <div className={styles.courseList}>
              {displayCourses.map((course: any) => (
                <div key={course.id_course} className={styles.courseItem}>
                  <div className={styles.courseLeft}>
                    <BookOpen size={16} className={styles.courseIcon} />
                    <div>
                      <span className={styles.courseName}>{course.name}</span>
                      {course.state && (
                        <span className={styles.courseState}>{course.state}</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.courseActions}>
                    <select
                      className={styles.stateSelect}
                      value={course.state || 'active'}
                      onChange={(e) => updateCourse({ courseId: course.id_course, state: e.target.value })}
                      disabled={isUpdatingCourse}
                    >
                      <option value="active">Cursando</option>
                      <option value="finished">Finalizado</option>
                    </select>
                    <button
                      className={styles.deleteCourseButton}
                      onClick={() => {
                        setCourseToDelete(course.id_course);
                        setDeleteConfirmVisible(true);
                      }}
                      disabled={isDeletingCourse}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyCoursesText}>No tienes cursos registrados</p>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button onClick={handleOpenEdit} className={styles.editButton}>
            <Edit3 size={16} />
            Editar Perfil
          </button>
          <button onClick={() => authStore.clearAuth()} className={styles.logoutButton}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModalVisible && (
        <div className={styles.modalOverlay} onClick={() => setEditModalVisible(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Editar Perfil</h2>
              <button onClick={() => setEditModalVisible(false)} className={styles.modalClose}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Teléfono</label>
                <input
                  type="text"
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Tu número de teléfono"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Sobre ti</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntanos sobre ti..."
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => setEditModalVisible(false)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className={styles.saveButton}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      <AddCourseModal
        visible={addCourseModalVisible}
        courses={availableCourses as any}
        loading={isAddingCourse}
        onClose={() => setAddCourseModalVisible(false)}
        onAdd={(courseId) => {
          addCourse({ id_course: courseId, status: 'active' });
          setAddCourseModalVisible(false);
        }}
      />

      {/* Delete Course Confirmation */}
      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Eliminar Curso"
        message="¿Estás seguro de que quieres eliminar este curso de tu perfil?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (courseToDelete) {
            deleteCourse(courseToDelete);
          }
          setDeleteConfirmVisible(false);
          setCourseToDelete(null);
        }}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setCourseToDelete(null);
        }}
        loading={isDeletingCourse}
      />
    </div>
  );
});
