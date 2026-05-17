import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Modal, TextInput,
  StyleSheet, Image, ActivityIndicator, ScrollView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resourcesService } from '../services/resources.service';
import { showToast } from '@/src/lib/toast';
import type { Resource, TipoContenido, CreateResourcePayload } from '@uniconnect/shared';

const TIPOS: { value: TipoContenido | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'ENLACE', label: 'Enlace' },
  { value: 'DOCUMENTO', label: 'Documento' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'IMAGEN', label: 'Imagen' },
  { value: 'ARTICULO', label: 'Artículo' },
  { value: 'OTRO', label: 'Otro' },
];

interface Props {
  groupId: number;
  currentUserId: number;
  isOwner: boolean;
}

export const ResourceLibrary: React.FC<Props> = ({ groupId, currentUserId, isOwner }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<TipoContenido | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ url: '', titulo: '', tipo: 'ENLACE' as TipoContenido, etiquetas: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await resourcesService.listar(groupId, filtro || undefined);
      setResources(data);
    } catch {
      showToast.error('Error', 'No se pudieron cargar los recursos');
    } finally {
      setLoading(false);
    }
  }, [groupId, filtro]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.url && !form.titulo) {
      showToast.error('Requerido', 'Ingresa una URL o un título');
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateResourcePayload = {
        url_externa: form.url || undefined,
        titulo: form.titulo || undefined,
        tipo_contenido: form.tipo,
        etiquetas: form.etiquetas ? form.etiquetas.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      const newResource = await resourcesService.crear(groupId, payload);
      setResources((prev) => [newResource, ...prev]);
      setShowModal(false);
      setForm({ url: '', titulo: '', tipo: 'ENLACE', etiquetas: '' });
      showToast.success('Recurso agregado');
    } catch (err: any) {
      showToast.error('Error', err?.response?.data?.message ?? 'No se pudo crear el recurso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, createdBy: number) => {
    if (createdBy !== currentUserId && !isOwner) {
      showToast.error('Sin permiso', 'Solo el propietario o admin puede eliminar');
      return;
    }
    try {
      await resourcesService.eliminar(groupId, id);
      setResources((prev) => prev.filter((r) => r.id_resource !== id));
      showToast.success('Recurso eliminado');
    } catch {
      showToast.error('Error', 'No se pudo eliminar el recurso');
    }
  };

  const renderResource = ({ item: r }: { item: Resource }) => {
    const dec = r.decoradores;
    return (
      <View style={styles.card}>
        {/* CA6: imagen Open Graph */}
        {dec.imagen_preview ? (
          <Image source={{ uri: dec.imagen_preview }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="document-text-outline" size={28} color="#3a3a3a" />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{r.titulo}</Text>
          {r.descripcion ? (
            <Text style={styles.cardDesc} numberOfLines={2}>{r.descripcion}</Text>
          ) : null}
          <View style={styles.metaRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>{r.tipo_contenido}</Text></View>
            {dec.etiquetas?.map((t) => (
              <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
            ))}
            {dec.valoracion && (
              <Text style={styles.rating}>★ {dec.valoracion.promedio.toFixed(1)}</Text>
            )}
          </View>
        </View>
        <View style={styles.cardFooter}>
          {r.url_externa ? (
            <TouchableOpacity onPress={() => Linking.openURL(r.url_externa!)}>
              <Text style={styles.linkText}>🔗 Abrir enlace</Text>
            </TouchableOpacity>
          ) : <View />}
          {(r.created_by === currentUserId || isOwner) && (
            <TouchableOpacity onPress={() => handleDelete(r.id_resource, r.created_by)}>
              <Ionicons name="trash-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Toolbar — filtro por tipo */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={String(t.value)}
            style={[styles.filterChip, filtro === t.value && styles.filterChipActive]}
            onPress={() => setFiltro(t.value as TipoContenido | '')}
          >
            <Text style={[styles.filterChipText, filtro === t.value && styles.filterChipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={16} color="#111" />
        <Text style={styles.addBtnText}>Agregar recurso</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color="#D9B97E" style={{ marginTop: 12 }} />
      ) : resources.length === 0 ? (
        <Text style={styles.empty}>No hay recursos. ¡Agrega el primero!</Text>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(r) => String(r.id_resource)}
          renderItem={renderResource}
          scrollEnabled={false}
        />
      )}

      {/* Modal agregar recurso */}
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
            <TextInput
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor="#6B7280"
              value={form.url}
              onChangeText={(v) => setForm((p) => ({ ...p, url: v }))}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Título (opcional si hay URL)</Text>
            <TextInput
              style={styles.input}
              placeholder="Título del recurso"
              placeholderTextColor="#6B7280"
              value={form.titulo}
              onChangeText={(v) => setForm((p) => ({ ...p, titulo: v }))}
            />

            <Text style={styles.label}>Tipo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {TIPOS.filter((t) => t.value !== '').map((t) => (
                <TouchableOpacity
                  key={String(t.value)}
                  style={[styles.filterChip, form.tipo === t.value && styles.filterChipActive]}
                  onPress={() => setForm((p) => ({ ...p, tipo: t.value as TipoContenido }))}
                >
                  <Text style={[styles.filterChipText, form.tipo === t.value && styles.filterChipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Etiquetas (separadas por coma)</Text>
            <TextInput
              style={styles.input}
              placeholder="IA, Paper, Referencia"
              placeholderTextColor="#6B7280"
              value={form.etiquetas}
              onChangeText={(v) => setForm((p) => ({ ...p, etiquetas: v }))}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#111" />
              ) : (
                <Text style={styles.submitBtnText}>Agregar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10 },
  filterScroll: { marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: 'rgba(217,185,126,0.2)',
    marginRight: 6,
  },
  filterChipActive: { backgroundColor: 'rgba(217,185,126,0.15)', borderColor: '#D9B97E' },
  filterChipText: { color: '#9CA3AF', fontSize: 12 },
  filterChipTextActive: { color: '#D9B97E', fontWeight: '700' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#D9B97E', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 9, alignSelf: 'flex-start',
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#111' },
  card: {
    backgroundColor: '#2a2a2a', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(217,185,126,0.15)',
    marginBottom: 10, overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 100 },
  cardImagePlaceholder: {
    width: '100%', height: 100, backgroundColor: '#1e1e1e',
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { padding: 10, gap: 5 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 18 },
  cardDesc: { color: '#9CA3AF', fontSize: 12, lineHeight: 16 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, alignItems: 'center' },
  badge: { backgroundColor: 'rgba(217,185,126,0.12)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#D9B97E', fontSize: 11, fontWeight: '600' },
  tag: { backgroundColor: 'rgba(107,114,128,0.2)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  tagText: { color: '#9CA3AF', fontSize: 11 },
  rating: { color: '#F59E0B', fontSize: 12 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  linkText: { color: '#D9B97E', fontSize: 12 },
  empty: { color: '#6B7280', fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1e1e1e', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, gap: 10, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  label: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: '#2a2a2a', color: '#fff', borderWidth: 1,
    borderColor: 'rgba(217,185,126,0.2)', borderRadius: 8, padding: 10, fontSize: 14,
  },
  submitBtn: { backgroundColor: '#D9B97E', borderRadius: 9, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#111' },
});
