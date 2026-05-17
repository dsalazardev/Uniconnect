import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Trash2, Link, ChevronLeft } from 'lucide-react';
import { api } from '@/constants/api';
import { authStore } from '@/features/auth/store/AuthStore';
import { showToast } from '@/lib/toast';
import type { Resource, ProgramaSummary, TipoContenido, CreateResourcePayload } from '@uniconnect/shared';
import { BIBLIOTECA_ENDPOINTS } from '@uniconnect/shared';

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
  const [programas, setProgramas] = useState<ProgramaSummary[]>([]);
  const [programaActivo, setProgramaActivo] = useState<number | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<TipoContenido | ''>('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateResourcePayload & { etiquetasInput: string }>({
    url_externa: '', titulo: '', tipo_contenido: 'ENLACE', etiquetasInput: '',
  });

  const currentUserId = authStore.user?.id_user ?? 0;
  const userProgramId = authStore.user?.id_program ?? null;

  // Cargar programas al montar
  useEffect(() => {
    api.get(BIBLIOTECA_ENDPOINTS.MIS_PROGRAMAS)
      .then((r) => {
        const list: ProgramaSummary[] = Array.isArray(r.data) ? r.data : [];
        setProgramas(list);
        // Seleccionar programa del usuario por defecto
        const defaultId = list.find((p) => p.id_program === userProgramId)?.id_program ?? list[0]?.id_program ?? null;
        setProgramaActivo(defaultId);
      })
      .catch(() => showToast.error('Error', 'No se pudieron cargar los programas'));
  }, [userProgramId]);

  // Cargar recursos cuando cambia programa o filtro
  const cargarRecursos = useCallback(() => {
    if (!programaActivo) return;
    setLoading(true);
    const url = BIBLIOTECA_ENDPOINTS.LIST_BY_PROGRAM(programaActivo, filtroTipo || undefined);
    api.get(url)
      .then((r) => setResources(Array.isArray(r.data) ? r.data : []))
      .catch(() => showToast.error('Error', 'No se pudieron cargar los recursos'))
      .finally(() => setLoading(false));
  }, [programaActivo, filtroTipo]);

  useEffect(() => { cargarRecursos(); }, [cargarRecursos]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programaActivo) return;
    setSubmitting(true);
    try {
      const { etiquetasInput, ...rest } = form;
      const payload: CreateResourcePayload = {
        ...rest,
        etiquetas: etiquetasInput ? etiquetasInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      const { data: newResource } = await api.post(BIBLIOTECA_ENDPOINTS.CREATE(programaActivo), payload);
      setResources((p) => [newResource, ...p]);
      setShowModal(false);
      setForm({ url_externa: '', titulo: '', tipo_contenido: 'ENLACE', etiquetasInput: '' });
      showToast.success('Recurso agregado');
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
      showToast.success('Recurso eliminado');
    } catch (err: any) {
      showToast.error('Error', err?.response?.data?.message ?? 'Sin permiso para eliminar');
    }
  };

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh', background: '#1e1e1e' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <BookOpen size={26} color="#D9B97E" />
        <h1 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 800 }}>Biblioteca de Recursos</h1>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Sidebar: programas (segmentación) */}
        <div style={{
          width: 200, flexShrink: 0, background: '#2a2a2a',
          borderRadius: 10, padding: 12, border: '1px solid rgba(217,185,126,0.15)',
        }}>
          <p style={{ margin: '0 0 10px', color: '#aaa', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
            Programas
          </p>
          {programas.length === 0
            ? <p style={{ color: '#555', fontSize: 13 }}>Sin programas</p>
            : programas.map((p) => (
              <button
                key={p.id_program}
                onClick={() => { setProgramaActivo(p.id_program); setFiltroTipo(''); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: programaActivo === p.id_program ? 'rgba(217,185,126,0.15)' : 'none',
                  border: 'none', borderRadius: 7, padding: '9px 10px',
                  color: programaActivo === p.id_program ? '#D9B97E' : '#ccc',
                  fontWeight: programaActivo === p.id_program ? 700 : 400,
                  fontSize: 13, cursor: 'pointer', marginBottom: 2,
                }}
              >
                {p.name ?? `Programa ${p.id_program}`}
              </button>
            ))
          }
        </div>

        {/* Main content */}
        <div style={{ flex: 1 }}>
          {programaActivo ? (
            <>
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value as TipoContenido | '')}
                  style={{ background: '#2a2a2a', color: '#fff', border: '1px solid rgba(217,185,126,0.25)', borderRadius: 7, padding: '7px 10px', fontSize: 13 }}
                >
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <button
                  onClick={() => setShowModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#D9B97E', color: '#111', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  <Plus size={14} /> Agregar recurso
                </button>
              </div>

              {/* Resource grid */}
              {loading ? (
                <p style={{ color: '#888' }}>Cargando recursos...</p>
              ) : resources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#555' }}>
                  <BookOpen size={40} />
                  <p style={{ marginTop: 12 }}>No hay recursos en este programa.<br />¡Sé el primero en agregar uno!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {resources.map((r) => {
                    const dec = r.decoradores;
                    return (
                      <div key={r.id_resource} style={{ background: '#2a2a2a', borderRadius: 10, border: '1px solid rgba(217,185,126,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {dec.imagen_preview
                          ? <img src={dec.imagen_preview} alt={r.titulo} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: 120, background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={32} color="#333" /></div>
                        }
                        <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <h4 style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 700 }}>{r.titulo}</h4>
                          {r.descripcion && <p style={{ margin: 0, color: '#9CA3AF', fontSize: 12 }}>{r.descripcion.slice(0, 80)}…</p>}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            <span style={{ background: 'rgba(217,185,126,0.12)', color: '#D9B97E', fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4 }}>{r.tipo_contenido}</span>
                            {dec.etiquetas?.map((t) => <span key={t} style={{ background: 'rgba(107,114,128,0.2)', color: '#9CA3AF', fontSize: 11, padding: '2px 5px', borderRadius: 4 }}>{t}</span>)}
                            {dec.valoracion && <span style={{ color: '#F59E0B', fontSize: 12 }}>★ {dec.valoracion.promedio.toFixed(1)}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          {r.url_externa
                            ? <a href={r.url_externa} target="_blank" rel="noreferrer" style={{ color: '#D9B97E', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Link size={12} /> Abrir</a>
                            : <span />
                          }
                          {r.created_by === currentUserId && (
                            <button onClick={() => handleDelete(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <p style={{ color: '#555' }}>Selecciona un programa para ver sus recursos.</p>
          )}
        </div>
      </div>

      {/* Modal agregar recurso */}
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
                  <input
                    value={(form as any)[key] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(217,185,126,0.2)', borderRadius: 7, padding: '9px 11px', fontSize: 14, boxSizing: 'border-box' }}
                  />
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
                <input value={form.etiquetasInput ?? ''} onChange={(e) => setForm((p) => ({ ...p, etiquetasInput: e.target.value }))}
                  placeholder="IA, Deep Learning, Paper"
                  style={{ width: '100%', background: '#1e1e1e', color: '#fff', border: '1px solid rgba(217,185,126,0.2)', borderRadius: 7, padding: '9px 11px', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: '1px solid #444', color: '#aaa', borderRadius: 7, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
                <button type="submit" disabled={submitting} style={{ background: '#D9B97E', color: '#111', border: 'none', borderRadius: 7, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
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
