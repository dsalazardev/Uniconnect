import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Trash2, Link, Star, MessageCircle, Send, X, ArrowLeft, ExternalLink } from 'lucide-react';
import { api } from '@/constants/api';
import { authStore } from '@/features/auth/store/AuthStore';
import { showToast } from '@/lib/toast';
import type { Resource, TipoContenido, CreateResourcePayload } from '@uniconnect/shared';
import { BIBLIOTECA_ENDPOINTS, ResourceArraySchema, ResourceSchema, validateApiResponse } from '@uniconnect/shared';

const TIPOS: { value: TipoContenido | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'ENLACE', label: 'Enlace' },
  { value: 'DOCUMENTO', label: 'Documento' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'IMAGEN', label: 'Imagen' },
  { value: 'ARTICULO', label: 'Artículo' },
  { value: 'OTRO', label: 'Otro' },
];

export const BibliotecaPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<TipoContenido | ''>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateResourcePayload & { etiquetasInput: string }>({
    url_externa: '', titulo: '', tipo_contenido: 'ENLACE', etiquetasInput: '',
  });

  // Estado para panel de detalle (comentar/valorar)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

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

  const refreshSelected = useCallback(async (id: number) => {
    try {
      const { data } = await api.get(BIBLIOTECA_ENDPOINTS.GET(id));
      const updated = validateApiResponse(ResourceSchema, data) as Resource;
      setSelectedResource(updated);
      setResources((prev) => prev.map((r) => r.id_resource === id ? updated : r));
    } catch {
      silentRefresh();
    }
  }, [silentRefresh]);

  useEffect(() => { cargarRecursos(); }, [cargarRecursos]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId) return;
    setSubmitting(true);
    try {
      const { etiquetasInput, ...rest } = form;
      const payload: CreateResourcePayload = {
        ...rest,
        etiquetas: etiquetasInput ? etiquetasInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      const { data: rawResource } = await api.post(BIBLIOTECA_ENDPOINTS.CREATE(programId), payload);
      const newResource = validateApiResponse(ResourceSchema, rawResource) as Resource;
      setResources((p) => [newResource, ...p]);
      setShowModal(false);
      setForm({ url_externa: '', titulo: '', tipo_contenido: 'ENLACE', etiquetasInput: '' });
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
      if (selectedResource?.id_resource === r.id_resource) setSelectedResource(null);
      showToast.success('Recurso eliminado');
    } catch (err: any) {
      showToast.error('Error', err?.response?.data?.message ?? 'Sin permiso para eliminar');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await api.post(BIBLIOTECA_ENDPOINTS.COMMENT(selectedResource.id_resource), { contenido: commentText.trim() });
      setCommentText('');
      showToast.success('Comentario agregado');
      await refreshSelected(selectedResource.id_resource);
    } catch (err: any) {
      showToast.error('Error', err?.response?.data?.message ?? 'No se pudo agregar el comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleRate = async (valor: number) => {
    if (!selectedResource) return;
    setSubmittingRating(true);
    try {
      await api.post(BIBLIOTECA_ENDPOINTS.RATE(selectedResource.id_resource), { valor });
      showToast.success('Valoración guardada');
      await refreshSelected(selectedResource.id_resource);
    } catch (err: any) {
      showToast.error('Error', err?.response?.data?.message ?? 'No se pudo guardar la valoración');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!programId) {
    return (
      <div style={{ padding: '48px 28px', textAlign: 'center', color: '#555' }}>
        <BookOpen size={40} />
        <p style={{ marginTop: 12 }}>No tienes un programa académico asignado.</p>
      </div>
    );
  }

  const promedio = selectedResource?.decoradores.valoracion?.promedio ?? 0;
  const comentarios = selectedResource?.decoradores.comentarios ?? [];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#1e1e1e', overflow: 'hidden' }}>
      {/* ── Panel izquierdo: lista ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BookOpen size={24} color="#D9B97E" />
            <h1 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 800 }}>Biblioteca de Recursos</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#D9B97E', color: '#111', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            <Plus size={15} /> Agregar recurso
          </button>
        </div>

        {/* Filtro */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {TIPOS.map((t) => (
            <button key={t.value} onClick={() => setFiltroTipo(t.value as TipoContenido | '')}
              style={{
                background: filtroTipo === t.value ? 'rgba(217,185,126,0.15)' : '#2a2a2a',
                color: filtroTipo === t.value ? '#D9B97E' : '#9CA3AF',
                border: `1px solid ${filtroTipo === t.value ? '#D9B97E' : 'rgba(217,185,126,0.15)'}`,
                borderRadius: 20, padding: '5px 14px', fontSize: 13,
                fontWeight: filtroTipo === t.value ? 700 : 400, cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid de recursos */}
        {loading ? (
          <p style={{ color: '#888' }}>Cargando recursos...</p>
        ) : resources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#555' }}>
            <BookOpen size={44} />
            <p style={{ marginTop: 12 }}>No hay recursos aún. ¡Agrega el primero!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {resources.map((r) => {
              const dec = r.decoradores;
              const isSelected = selectedResource?.id_resource === r.id_resource;
              return (
                <div
                  key={r.id_resource}
                  onClick={() => setSelectedResource(r)}
                  style={{
                    background: '#2a2a2a', borderRadius: 10, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', cursor: 'pointer',
                    border: `1px solid ${isSelected ? '#D9B97E' : 'rgba(217,185,126,0.15)'}`,
                    transition: 'border-color 0.15s',
                  }}
                >
                  {dec.imagen_preview
                    ? <img src={dec.imagen_preview} alt={r.titulo} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: 120, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={28} color="#333" /></div>
                  }
                  <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{r.titulo}</h4>
                    {r.descripcion && <p style={{ margin: 0, color: '#9CA3AF', fontSize: 11, lineHeight: 1.4 }}>{r.descripcion.slice(0, 70)}{r.descripcion.length > 70 ? '…' : ''}</p>}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                      <span style={{ background: 'rgba(217,185,126,0.12)', color: '#D9B97E', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4 }}>{r.tipo_contenido}</span>
                      {dec.etiquetas?.map((t) => <span key={t} style={{ background: 'rgba(107,114,128,0.2)', color: '#9CA3AF', fontSize: 10, padding: '1px 5px', borderRadius: 4 }}>{t}</span>)}
                      {dec.valoracion && <span style={{ color: '#F59E0B', fontSize: 11 }}>★ {dec.valoracion.promedio.toFixed(1)}</span>}
                      {(dec.comentarios?.length ?? 0) > 0 && <span style={{ color: '#9CA3AF', fontSize: 10 }}>💬 {dec.comentarios!.length}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Panel derecho: detalle ── */}
      {selectedResource && (
        <div style={{ width: 380, borderLeft: '1px solid rgba(217,185,126,0.15)', background: '#181818', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Header del panel */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#181818', zIndex: 1 }}>
            <button onClick={() => setSelectedResource(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, display: 'flex' }}>
              <X size={18} />
            </button>
            <span style={{ flex: 1, color: '#fff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedResource.titulo}</span>
            {selectedResource.created_by === currentUserId && (
              <button onClick={() => handleDelete(selectedResource)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, display: 'flex' }}>
                <Trash2 size={15} />
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {/* Imagen */}
            {selectedResource.decoradores.imagen_preview
              ? <img src={selectedResource.decoradores.imagen_preview} alt={selectedResource.titulo} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 14 }} />
              : <div style={{ width: '100%', height: 120, background: '#2a2a2a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><BookOpen size={32} color="#444" /></div>
            }

            {/* Tipo + tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              <span style={{ background: 'rgba(217,185,126,0.12)', color: '#D9B97E', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{selectedResource.tipo_contenido}</span>
              {selectedResource.decoradores.etiquetas?.map((t) => <span key={t} style={{ background: 'rgba(107,114,128,0.2)', color: '#9CA3AF', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>{t}</span>)}
            </div>

            {/* Descripción */}
            {selectedResource.descripcion && (
              <p style={{ color: '#9CA3AF', fontSize: 13, lineHeight: 1.5, margin: '0 0 12px' }}>{selectedResource.descripcion}</p>
            )}

            {/* Enlace */}
            {selectedResource.url_externa && (
              <a href={selectedResource.url_externa} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#D9B97E', color: '#111', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none', marginBottom: 20 }}
              >
                <ExternalLink size={13} /> Abrir enlace
              </a>
            )}

            {/* ── Valoración ── */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Star size={15} color="#F59E0B" /> Valoración
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => !submittingRating && handleRate(star)}
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(0)}
                    disabled={submittingRating}
                    style={{ background: 'none', border: 'none', cursor: submittingRating ? 'not-allowed' : 'pointer', padding: 2, fontSize: 24,
                      color: star <= (hoverStar || Math.round(promedio)) ? '#F59E0B' : '#444',
                      transition: 'color 0.1s' }}
                  >
                    ★
                  </button>
                ))}
                {promedio > 0 && (
                  <span style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 6 }}>
                    {promedio.toFixed(1)} ({selectedResource.decoradores.valoracion?.total ?? 0} votos)
                  </span>
                )}
                {submittingRating && <span style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 8 }}>Guardando...</span>}
              </div>
            </div>

            {/* ── Comentarios ── */}
            <div>
              <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageCircle size={15} color="#D9B97E" /> Comentarios ({comentarios.length})
              </h4>

              {comentarios.length === 0 ? (
                <p style={{ color: '#555', fontSize: 13, fontStyle: 'italic', marginBottom: 16 }}>Sé el primero en comentar</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {comentarios.map((c) => (
                    <div key={c.id_comment} style={{ background: '#2a2a2a', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#D9B97E', fontSize: 12, fontWeight: 700 }}>{c.usuario}</span>
                        <span style={{ color: '#6B7280', fontSize: 11 }}>
                          {new Date(c.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: '#e0e0e0', fontSize: 13, lineHeight: 1.4 }}>{c.contenido}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar comentario */}
              <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe un comentario..."
                  maxLength={500}
                  rows={2}
                  style={{
                    flex: 1, background: '#2a2a2a', color: '#fff', border: '1px solid rgba(217,185,126,0.2)',
                    borderRadius: 8, padding: '8px 10px', fontSize: 13, resize: 'vertical',
                    fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  style={{
                    background: '#D9B97E', border: 'none', borderRadius: 8, padding: '0 12px',
                    cursor: !commentText.trim() || submittingComment ? 'not-allowed' : 'pointer',
                    opacity: !commentText.trim() || submittingComment ? 0.4 : 1,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Send size={16} color="#111" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal agregar recurso ── */}
      {showModal && (
        <div onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#2a2a2a', borderRadius: 12, padding: 24, width: '100%', maxWidth: 480, border: '1px solid rgba(217,185,126,0.2)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: 17, fontWeight: 800 }}>Agregar recurso</h3>
            <form onSubmit={handleCreate} style={{ display: 'contents' }}>
              {[
                { label: 'URL externa', key: 'url_externa', placeholder: 'https://...' },
                { label: 'Título (opcional si hay URL)', key: 'titulo', placeholder: 'Título del recurso' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', color: '#aaa', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</label>
                  <input value={(form as any)[key] ?? ''} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                    style={{ width: '100%', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(217,185,126,0.2)', borderRadius: 7, padding: '9px 11px', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Tipo</label>
                <select value={form.tipo_contenido} onChange={(e) => setForm((p) => ({ ...p, tipo_contenido: e.target.value as TipoContenido }))}
                  style={{ width: '100%', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(217,185,126,0.2)', borderRadius: 7, padding: '9px 11px', fontSize: 14 }}>
                  {TIPOS.filter((t) => t.value !== '').map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#aaa', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Etiquetas (separadas por coma)</label>
                <input value={form.etiquetasInput ?? ''} onChange={(e) => setForm((p) => ({ ...p, etiquetasInput: e.target.value }))} placeholder="IA, Deep Learning, Paper"
                  style={{ width: '100%', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(217,185,126,0.2)', borderRadius: 7, padding: '9px 11px', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid #444', color: '#aaa', borderRadius: 7, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
                <button type="submit" disabled={submitting} style={{ background: '#D9B97E', color: '#111', border: 'none', borderRadius: 7, padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
