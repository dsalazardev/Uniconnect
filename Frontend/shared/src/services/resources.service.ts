import type { AxiosInstance } from 'axios';
import type { Resource, CreateResourcePayload, UpdateResourcePayload, TipoContenido } from '../types/resources';
import { RESOURCES_ENDPOINTS } from '../api/endpoints/resources';

export class ResourcesService {
  constructor(private readonly api: AxiosInstance) {}

  async listar(groupId: number, tipo?: TipoContenido): Promise<Resource[]> {
    const { data } = await this.api.get(RESOURCES_ENDPOINTS.LIST(groupId, tipo));
    return Array.isArray(data) ? data : [];
  }

  async crear(groupId: number, payload: CreateResourcePayload): Promise<Resource> {
    const { data } = await this.api.post(RESOURCES_ENDPOINTS.CREATE(groupId), payload);
    return data;
  }

  async obtener(groupId: number, id: number): Promise<Resource> {
    const { data } = await this.api.get(RESOURCES_ENDPOINTS.GET(groupId, id));
    return data;
  }

  async editar(groupId: number, id: number, payload: UpdateResourcePayload): Promise<Resource> {
    const { data } = await this.api.patch(RESOURCES_ENDPOINTS.UPDATE(groupId, id), payload);
    return data;
  }

  async eliminar(groupId: number, id: number): Promise<void> {
    await this.api.delete(RESOURCES_ENDPOINTS.DELETE(groupId, id));
  }

  async comentar(groupId: number, id: number, contenido: string): Promise<unknown> {
    const { data } = await this.api.post(RESOURCES_ENDPOINTS.COMMENT(groupId, id), { contenido });
    return data;
  }

  async valorar(groupId: number, id: number, valor: number): Promise<unknown> {
    const { data } = await this.api.post(RESOURCES_ENDPOINTS.RATE(groupId, id), { valor });
    return data;
  }
}
