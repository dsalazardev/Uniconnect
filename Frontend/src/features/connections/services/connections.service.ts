import { api } from '@/src/constants/api';
import { CONNECTION_ENDPOINTS } from '../api/endpoints';
import {
    AcceptRejectResponse,
    ConnectionRequest,
    ConnectionResponse,
    ConnectionStatus,
    SendConnectionRequestDto,
} from '../types';

class ConnectionService {
    async getPendingRequests(): Promise<ConnectionRequest[]> {
        const response = await api.get<ConnectionRequest[]>(
            CONNECTION_ENDPOINTS.PENDING_REQUESTS
        );
        return response.data;
    }

    async getMyConnections(): Promise<ConnectionRequest[]> {
        const response = await api.get<ConnectionRequest[]>(
            CONNECTION_ENDPOINTS.MY_CONNECTIONS
        );
        return response.data;
    }

    async sendConnectionRequest(
        data: SendConnectionRequestDto
    ): Promise<ConnectionResponse> {
        const response = await api.post<ConnectionResponse>(
            CONNECTION_ENDPOINTS.SEND_REQUEST,
            data
        );
        return response.data;
    }

    async acceptConnectionRequest(connectionId: number): Promise<AcceptRejectResponse> {
        const response = await api.patch<AcceptRejectResponse>(
            CONNECTION_ENDPOINTS.ACCEPT_REQUEST.replace(':id', connectionId.toString())
        );
        return response.data;
    }

    async rejectConnectionRequest(connectionId: number): Promise<AcceptRejectResponse> {
        const response = await api.patch<AcceptRejectResponse>(
            CONNECTION_ENDPOINTS.REJECT_REQUEST.replace(':id', connectionId.toString())
        );
        return response.data;
    }

    async cancelRequest(connectionId: number): Promise<AcceptRejectResponse> {
        const response = await api.delete<AcceptRejectResponse>(
            CONNECTION_ENDPOINTS.CANCEL_REQUEST.replace(':id', connectionId.toString())
        );
        return response.data;
    }

    async deleteConnection(connectionId: number): Promise<AcceptRejectResponse> {
        const response = await api.delete<AcceptRejectResponse>(
            CONNECTION_ENDPOINTS.DELETE_CONNECTION.replace(':id', connectionId.toString())
        );
        return response.data;
    }

    async getConnectionStatus(userId: number): Promise<ConnectionStatus> {
        const response = await api.get<ConnectionStatus>(
            `${CONNECTION_ENDPOINTS.GET_STATUS}/${userId}`
        );
        return response.data;
    }
}

export const connectionService = new ConnectionService();