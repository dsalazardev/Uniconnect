export interface ConnectionRequest {
  id_connection: number;
  requester: {
    id_user: number;
    full_name: string;
    email: string;
    picture?: string;
    program: { name: string };
  };
  request_at: string;
  status: string;
}

export interface SendConnectionRequestDto {
  addressee_id: number;
}

export interface ConnectionResponse {
  id_connection: number;
  message: string;
}

export interface AcceptRejectResponse {
  message: string;
  connection: {
    id_connection: number;
    requester_id: number;
    adressee_id: number;
    status: string;
    request_at: string;
    respondend_at: string;
  };
}

export interface ConnectionStatus {
  id_connection: number | null;
  status: 'none' | 'pending' | 'accepted' | 'rejected';
  is_requester?: boolean;
}