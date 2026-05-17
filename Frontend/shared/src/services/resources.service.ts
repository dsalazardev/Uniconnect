import type { AxiosInstance } from 'axios';
import type {
  Resource,
  ProgramaSummary,
  CreateResourcePayload,
  UpdateResourcePayload,
  TipoContenido,
} from '../types/resources';
import { BIBLIOTECA_ENDPOINTS } from '../api/endpoints/resources';

export class ResourcesService {
  constructor(private readonly api: AxiosInstance) {}

  async misProgramas(): Promise<ProgramaSummary[]> {
    const { data } = await this.api.get(BIBLIOTECA_ENDPOINTS.MIS_PROGRAMAS);
    return Array.isArray(data) ? data : [];
  }

  async listarPorPrograma(programId: number, tipo?: TipoContenido): Promise<Resource[]> {
    const { data } = await this.api.get(BIBLIOTECA_ENDPOINTS.LIST_BY_PROGRAM(programId, tipo));
    return Array.isArray(data) ? data : [];
  }

  async crear(programId: number, payload: CreateResourcePayload): Promise<Resource> {
    const { data } = await this.api.post(BIBLIOTECA_ENDPOINTS.CREATE(programId), payload);
    return data;
  }

  async obtener(id: number): Promise<Resource> {
    const { data } = await this.api.get(BIBLIOTECA_ENDPOINTS.GET(id));
    return data;
  }

  async editar(id: number, payload: UpdateResourcePayload): Promise<Resource> {
    const { data } = await this.api.patch(BIBLIOTECA_ENDPOINTS.UPDATE(id), payload);
    return data;
  }

  async eliminar(id: number): Promise<void> {
    await this.api.delete(BIBLIOTECA_ENDPOINTS.DELETE(id));
  }

  async comentar(id: number, contenido: string): Promise<unknown> {
    const { data } = await this.api.post(BIBLIOTECA_ENDPOINTS.COMMENT(id), { contenido });
    return data;
  }

  async valorar(id: number, valor: number): Promise<unknown> {
    const { data } = await this.api.post(BIBLIOTECA_ENDPOINTS.RATE(id), { valor });
    return data;
  }
}
