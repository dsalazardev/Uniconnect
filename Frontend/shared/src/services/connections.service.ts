/**
 * ConnectionsService - BFF (Backend for Frontend) layer with Dependency Injection
 * 
 * Handles HTTP communication with the backend API for connections.
 * Uses injected Axios instance for platform-agnostic HTTP calls.
 */

import type { AxiosInstance } from 'axios';
import type {
  AcceptRejectResponse,
  ConnectionRequest,
  ConnectionResponse,
  ConnectionStatus,
  SendConnectionRequestDto,
} from '../types/connections';
import { CONNECTIONS_ENDPOINTS } from '../api/endpoints';

export class ConnectionsService {
  private readonly api: AxiosInstance;

  /**
   * Constructor with Dependency Injection
   * @param axiosInstance - Configured Axios instance (injected)
   */
  constructor(axiosInstance: AxiosInstance) {
    this.api = axiosInstance;
  }

  /**
   * Get pending connection requests
   */
  async getPendingRequests(): Promise<ConnectionRequest[]> {
    const response = await this.api.get<ConnectionRequest[]>(CONNECTIONS_ENDPOINTS.PENDING_REQUESTS);
    return response.data;
  }

  /**
   * Get my connections
   */
  async getMyConnections(): Promise<ConnectionRequest[]> {
    const response = await this.api.get<ConnectionRequest[]>(CONNECTIONS_ENDPOINTS.MY_CONNECTIONS);
    return response.data;
  }

  /**
   * Send a connection request
   */
  async sendConnectionRequest(data: SendConnectionRequestDto): Promise<ConnectionResponse> {
    const response = await this.api.post<ConnectionResponse>(CONNECTIONS_ENDPOINTS.SEND_REQUEST, data);
    return response.data;
  }

  /**
   * Accept a connection request
   */
  async acceptConnectionRequest(connectionId: number): Promise<AcceptRejectResponse> {
    const response = await this.api.patch<AcceptRejectResponse>(
      CONNECTIONS_ENDPOINTS.ACCEPT_REQUEST(connectionId)
    );
    return response.data;
  }

  /**
   * Reject a connection request
   */
  async rejectConnectionRequest(connectionId: number): Promise<AcceptRejectResponse> {
    const response = await this.api.patch<AcceptRejectResponse>(
      CONNECTIONS_ENDPOINTS.REJECT_REQUEST(connectionId)
    );
    return response.data;
  }

  /**
   * Cancel a connection request
   */
  async cancelRequest(connectionId: number): Promise<AcceptRejectResponse> {
    const response = await this.api.delete<AcceptRejectResponse>(
      CONNECTIONS_ENDPOINTS.CANCEL_REQUEST(connectionId)
    );
    return response.data;
  }

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: number): Promise<AcceptRejectResponse> {
    const response = await this.api.delete<AcceptRejectResponse>(
      CONNECTIONS_ENDPOINTS.DELETE_CONNECTION(connectionId)
    );
    return response.data;
  }

  /**
   * Get connection status with a user
   */
  async getConnectionStatus(userId: number): Promise<ConnectionStatus> {
    const response = await this.api.get<ConnectionStatus>(`${CONNECTIONS_ENDPOINTS.GET_STATUS}/${userId}`);
    return response.data;
  }
}
