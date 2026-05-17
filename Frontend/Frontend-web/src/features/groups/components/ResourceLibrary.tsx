import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Trash2, Link, Star } from 'lucide-react';
import { resourcesService } from '../services/resources.service';
import { showToast } from '@/lib/toast';
import type { Resource, TipoContenido, CreateResourcePayload } from '@uniconnect/shared';
import styles from './ResourceLibrary.module.css';

const TIPOS: { value: TipoContenido | ''; label: string }[] = [
  { value: '', label: 'Todos los tipos' },
  { value: 'ENLACE', label: 'Enlace' },
  { value: 'DOCUMENTO', label: 'Documento' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'IMAGEN', label: 'Imagen' },
  { value: 'ARTICULO', label: 'Artículo' },
  { value: 'OTRO', label: 'Otro' },
];

interface ResourceLibraryProps {
  groupId: number;
  currentUserId: number;
  isOwner: boolean;
}

export const ResourceLibrary: React.FC<ResourceLibraryProps> = ({
  groupId,
  currentUserId,
  isOwner,
}) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<TipoContenido | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateResourcePayload>({
    url_externa: '',
    titulo: '',
    descripcion: '',
    tipo_contenido: 'ENLACE',
    etiquetas: [],
  });
  const [etiquetasInput, setEtiquetasInput] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await resourcesService.listar(groupId, filtroTipo || undefined);
      setResources(data);
    } catch {
      showToast.error('Error', 'No se pudieron cargar los recursos');
    } finally {
      setLoading(false);
    }
  }, [groupId, filtroTipo]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: CreateResourcePayload = {
        ...form,
        etiquetas: etiquetasInput
          ? etiquetasInput.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };
      const newResource = await resourcesService.crear(groupId, payload);
      setResources((prev) => [newResource, ...prev]);
      setShowModal(false);
      setForm({ url_externa: '', titulo: '', descripcion: '', tipo_contenido: 'ENLACE', etiquetas: [] });
      setEtiquetasInput('');
      showToast.success('Recurso agregado');
    } catch (err: any) {
      showToast.error('Error', err?.response?.data?.message ?? 'No se pudo crear el recurso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, createdBy: number) => {
    if (createdBy !== currentUserId && !isOwner) {
      showToast.error('Sin permiso', 'Solo el propietario o admin puede eliminar este recurso');
      return;
    }
    try {
      await resourcesService.eliminar(groupId, id);
      setResources((prev) => prev.filter((r) => r.id_resource !== id));
      showToast.success('Recurso eliminado');
    } catch (err: any) {
      showToast.error('Error', err?.response?.data?.message ?? 'No se pudo eliminar');
    }
  };

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <select
          className={styles.filterSelect}
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as TipoContenido | '')}
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <Plus size={14} /> Agregar
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.empty}><span className={styles.spinner} /></div>
      ) : resources.length === 0 ? (
        <p className={styles.empty}>No hay recursos en esta biblioteca</p>
      ) : (
        <div className={styles.grid}>
          {resources.map((r) => {
            const dec = r.decoradores;
            const stars = dec.valoracion
              ? `★ ${dec.valoracion.promedio.toFixed(1)} (${dec.valoracion.total})`
              : null;
            return (
              <div key={r.id_resource} className={styles.card}>
                {/* CA5: imagen Open Graph */}
                {dec.imagen_preview ? (
                  <img src={dec.imagen_preview} alt={r.titulo} className={styles.cardImage} />
                ) : (
                  <div className={styles.cardImagePlaceholder}>
                    <BookOpen size={28} color="#3a3a3a" />
                  </div>
                )}
                <div className={styles.cardBody}>
                  {/* CA5: título extraído */}
                  <h4 className={styles.cardTitle}>{r.titulo}</h4>
                  {r.descripcion && (
                    <p className={styles.cardDesc}>{r.descripcion.slice(0, 100)}{r.descripcion.length > 100 ? '…' : ''}</p>
                  )}
                  {/* CA5: decoradores activos */}
                  <div className={styles.cardMeta}>
                    <span className={styles.badge}>{r.tipo_contenido}</span>
                    {dec.etiquetas?.map((t) => (
                      <span key={t} className={styles.tag}>{t}</span>
                    ))}
                    {stars && <span className={styles.rating}>{stars}</span>}
                    {dec.comentarios && dec.comentarios.length > 0 && (
                      <span className={styles.tag}>💬 {dec.comentarios.length}</span>
                    )}
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span>
                    {r.url_externa && (
                      <a href={r.url_externa} target="_blank" rel="noreferrer" style={{ color: '#D9B97E' }}>
                        <Link size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Abrir enlace
                      </a>
                    )}
                  </span>
                  {(r.created_by === currentUserId || isOwner) && (
                    <button className={styles.deleteBtn} onClick={() => handleDelete(r.id_resource, r.created_by)}>
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {showModal && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Agregar recurso</h3>
            <form onSubmit={handleCreate} style={{ display: 'contents' }}>
              <div className={styles.modalRow}>
                <label className={styles.modalLabel}>URL externa</label>
                <input
                  className={styles.modalInput}
                  placeholder="https://..."
                  value={form.url_externa}
                  onChange={(e) => setForm((p) => ({ ...p, url_externa: e.target.value }))}
                />
              </div>
              <div className={styles.modalRow}>
                <label className={styles.modalLabel}>Título (opcional si hay URL)</label>
                <input
                  className={styles.modalInput}
                  placeholder="Título del recurso"
                  value={form.titulo}
                  onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                />
              </div>
              <div className={styles.modalRow}>
                <label className={styles.modalLabel}>Tipo</label>
                <select
                  className={styles.modalSelect}
                  value={form.tipo_contenido}
                  onChange={(e) => setForm((p) => ({ ...p, tipo_contenido: e.target.value as TipoContenido }))}
                >
                  {TIPOS.filter((t) => t.value !== '').map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.modalRow}>
                <label className={styles.modalLabel}>Etiquetas (separadas por coma)</label>
                <input
                  className={styles.modalInput}
                  placeholder="IA, Deep Learning, Paper"
                  value={etiquetasInput}
                  onChange={(e) => setEtiquetasInput(e.target.value)}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? <span className={styles.spinner} /> : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
