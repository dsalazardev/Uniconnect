import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  ScrollView, ActivityIndicator, Image, StyleSheet, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/constants/api';
import { authStore } from '@/src/features/auth/store/AuthStore';
import { showToast } from '@/src/lib/toast';
import { BIBLIOTECA_ENDPOINTS, ResourceArraySchema, ResourceSchema, validateApiResponse } from '@uniconnect/shared';
import type { Resource, TipoContenido } from '@uniconnect/shared';

const TIPOS: { value: TipoContenido | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'ENLACE', label: 'Enlace' },
  { value: 'DOCUMENTO', label: 'Doc' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'IMAGEN', label: 'Imagen' },
  { value: 'ARTICULO', label: 'Artículo' },
  { value: 'OTRO', label: 'Otro' },
];

export default function BibliotecaScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<TipoContenido | ''>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ url: '', titulo: '', tipo: 'ENLACE' as TipoContenido, etiquetas: '' });

  const currentUserId = authStore.user?.id_user ?? 0;
  const programId = authStore.user?.id_program ?? null;

  const cargarRecursos = useCallback(() => {
    if (!programId) return;
    setLoading(true);
    api.get(BIBLIOTECA_ENDPOINTS.LIST_BY_PROGRAM(programId, filtroTipo || undefined))
      .then((r) => {
        const validated = validateApiResponse(ResourceArraySchema, r.data);
        setResources(validated as Resource[]);
      })
      .catch((err) => {
        if (err?.name === 'ApiValidationError') {
          showToast.error('Datos inválidos', 'La respuesta del servidor tiene un formato inesperado');
        } else {
          showToast.error('Error', 'No se pudieron cargar los recursos');
        }
      })
      .finally(() => setLoading(false));
  }, [programId, filtroTipo]);

  const silentRefresh = useCallback(() => {
    if (!programId) return;
    api.get(BIBLIOTECA_ENDPOINTS.LIST_BY_PROGRAM(programId, filtroTipo || undefined))
      .then((r) => {
        const validated = validateApiResponse(ResourceArraySchema, r.data);
        setResources(validated as Resource[]);
      })
      .catch(() => {});
  }, [programId, filtroTipo]);

  useEffect(() => { cargarRecursos(); }, [cargarRecursos]);

  const handleCreate = async () => {
    if (!programId || (!form.url && !form.titulo)) {
      showToast.error('Requerido', 'Ingresa una URL o un título');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        url_externa: form.url || undefined,
        titulo: form.titulo || undefined,
        tipo_contenido: form.tipo,
        etiquetas: form.etiquetas ? form.etiquetas.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      const { data: rawResource } = await api.post(BIBLIOTECA_ENDPOINTS.CREATE(programId), payload);
      const newResource = validateApiResponse(ResourceSchema, rawResource) as Resource;
      setResources((p) => [newResource, ...p]);
      setShowModal(false);
      setForm({ url: '', titulo: '', tipo: 'ENLACE', etiquetas: '' });
      showToast.success('Recurso agregado');
      silentRefresh();
    } catch (err: any) {
      showToast.error('Error', err?.response?.data?.message ?? 'No se pudo crear el recurso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (r: Resource) => {
    try {
      await api.delete(BIBLIOTECA_ENDPOINTS.DELETE(r.id_resource));
      setResources((p) => p.filter((x) => x.id_resource !== r.id_resource));
      showToast.success('Eliminado');
    } catch {
      showToast.error('Error', 'No tienes permiso para eliminar este recurso');
    }
  };

  if (!programId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="library-outline" size={44} color="#444" />
          <Text style={styles.emptyText}>No tienes un programa académico asignado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderResource = ({ item: r }: { item: Resource }) => {
    const dec = r.decoradores;
    return (
      <View style={styles.card}>
        {dec.imagen_preview
          ? <Image source={{ uri: dec.imagen_preview }} style={styles.cardImage} resizeMode="cover" />
          : <View style={styles.cardImagePlaceholder}><Ionicons name="document-text-outline" size={28} color="#333" /></View>
        }
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{r.titulo}</Text>
          {r.descripcion ? <Text style={styles.cardDesc} numberOfLines={2}>{r.descripcion}</Text> : null}
          <View style={styles.metaRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>{r.tipo_contenido}</Text></View>
            {dec.etiquetas?.map((t) => <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>)}
            {dec.valoracion && <Text style={styles.rating}>★ {dec.valoracion.promedio.toFixed(1)}</Text>}
          </View>
        </View>
        <View style={styles.cardFooter}>
          {r.url_externa
            ? <TouchableOpacity onPress={() => Linking.openURL(r.url_externa!)}>
                <Text style={styles.linkText}>🔗 Abrir enlace</Text>
              </TouchableOpacity>
            : <View />
          }
          {r.created_by === currentUserId && (
            <TouchableOpacity onPress={() => handleDelete(r)}>
              <Ionicons name="trash-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="library-outline" size={22} color="#D9B97E" />
          <Text style={styles.headerTitle}>Biblioteca de Recursos</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={18} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Filtro por tipo */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {TIPOS.map((t) => (
            <TouchableOpacity
              key={String(t.value)}
              style={[styles.filterChip, filtroTipo === t.value && styles.filterChipActive]}
              onPress={() => setFiltroTipo(t.value as TipoContenido | '')}
            >
              <Text style={[styles.filterChipText, filtroTipo === t.value && styles.filterChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista */}
      <View style={styles.listWrapper}>
      {loading
        ? <ActivityIndicator color="#D9B97E" style={{ marginTop: 40 }} />
        : <FlatList
            data={resources}
            keyExtractor={(r) => String(r.id_resource)}
            renderItem={renderResource}
            contentContainerStyle={resources.length === 0 ? styles.emptyContainer : styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="library-outline" size={44} color="#444" />
                <Text style={styles.emptyText}>No hay recursos aún. ¡Agrega el primero!</Text>
              </View>
            }
          />
      }
      </View>

      {/* Modal agregar */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar recurso</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={22} color="#aaa" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>URL externa</Text>
            <TextInput style={styles.input} placeholder="https://..." placeholderTextColor="#6B7280"
              value={form.url} onChangeText={(v) => setForm((p) => ({ ...p, url: v }))} autoCapitalize="none" keyboardType="url" />

            <Text style={styles.label}>Título (opcional si hay URL)</Text>
            <TextInput style={styles.input} placeholder="Título del recurso" placeholderTextColor="#6B7280"
              value={form.titulo} onChangeText={(v) => setForm((p) => ({ ...p, titulo: v }))} />

            <Text style={styles.label}>Tipo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {TIPOS.filter((t) => t.value !== '').map((t) => (
                <TouchableOpacity
                  key={String(t.value)}
                  style={[styles.filterChip, form.tipo === t.value && styles.filterChipActive]}
                  onPress={() => setForm((p) => ({ ...p, tipo: t.value as TipoContenido }))}
                >
                  <Text style={[styles.filterChipText, form.tipo === t.value && styles.filterChipTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Etiquetas (separadas por coma)</Text>
            <TextInput style={styles.input} placeholder="IA, Paper, Referencia" placeholderTextColor="#6B7280"
              value={form.etiquetas} onChangeText={(v) => setForm((p) => ({ ...p, etiquetas: v }))} />

            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleCreate} disabled={submitting}>
              {submitting
                ? <ActivityIndicator size="small" color="#111" />
                : <Text style={styles.submitBtnText}>Agregar recurso</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e1e1e' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  addBtn: { backgroundColor: '#D9B97E', borderRadius: 8, padding: 8 },
  filterContainer: { height: 44, marginBottom: 8 },
  listWrapper: { flex: 1 },
  filterChip: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 16, backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: 'rgba(217,185,126,0.15)', marginRight: 7 },
  filterChipActive: { backgroundColor: 'rgba(217,185,126,0.12)', borderColor: '#D9B97E' },
  filterChipText: { color: '#9CA3AF', fontSize: 12 },
  filterChipTextActive: { color: '#D9B97E', fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 28 },
  emptyContainer: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#555', fontSize: 14, marginTop: 12, textAlign: 'center' },
  card: { backgroundColor: '#2a2a2a', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(217,185,126,0.12)', marginBottom: 12, overflow: 'hidden' },
  cardImage: { width: '100%', height: 120 },
  cardImagePlaceholder: { width: '100%', height: 120, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 11, gap: 5 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  cardDesc: { color: '#9CA3AF', fontSize: 12, lineHeight: 16 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' },
  badge: { backgroundColor: 'rgba(217,185,126,0.12)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#D9B97E', fontSize: 11, fontWeight: '600' },
  tag: { backgroundColor: 'rgba(107,114,128,0.2)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  tagText: { color: '#9CA3AF', fontSize: 11 },
  rating: { color: '#F59E0B', fontSize: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  linkText: { color: '#D9B97E', fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1e1e1e', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, gap: 10, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  label: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: '#2a2a2a', color: '#fff', borderWidth: 1, borderColor: 'rgba(217,185,126,0.2)', borderRadius: 8, padding: 10, fontSize: 14 },
  submitBtn: { backgroundColor: '#D9B97E', borderRadius: 9, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#111' },
});
