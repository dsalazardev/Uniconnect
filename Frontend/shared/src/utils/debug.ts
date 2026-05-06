/**
 * Utilidades de debug para diagnosticar problemas de mensajería
 * 
 * IMPORTANTE: Este archivo es agnóstico de plataforma.
 * Todas las dependencias externas (URLs, servicios) deben ser inyectadas.
 */

export interface DiagnosticResult {
  timestamp: string;
  websocketUrl: string;
  apiUrl: string;
  wsConnected: boolean;
  wsConnectionTime?: number;
  apiHealthy: boolean;
  errors: string[];
}

export interface WebSocketServiceInterface {
  isConnected(): boolean;
  connect(url: string): void;
  authenticate(data: { id_user: number; id_group: number }): void;
  sendMessage(data: { text_content: string }): void;
}

export interface DiagnosticConfig {
  websocketUrl: string;
  apiUrl: string;
  websocketService: WebSocketServiceInterface;
}

/**
 * Ejecutar diagnóstico completo de la mensajería
 * 
 * @param config - Configuración con URLs y servicio WebSocket inyectados
 */
export async function runMessagingDiagnostics(
  config: DiagnosticConfig
): Promise<DiagnosticResult> {
  const { websocketUrl, apiUrl, websocketService } = config;
  const startTime = Date.now();
  const errors: string[] = [];
  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    websocketUrl,
    apiUrl,
    wsConnected: false,
    apiHealthy: false,
    errors,
  };

  try {
    // 1. Verificar conectividad API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      result.apiHealthy = response.ok;
      if (!response.ok) {
        errors.push(`⚠️ API respondió con estado: ${response.status}`);
      }
    } catch (apiError: unknown) {
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
      errors.push(`❌ Error conectando a API: ${errorMessage}`);
      console.error('Error de API:', apiError);
    }

    // 2. Verificar WebSocket
    if (!websocketService.isConnected()) {
      websocketService.connect(websocketUrl);
      
      // Esperar a que conecte
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          errors.push('❌ WebSocket no conectó en 5 segundos');
          resolve();
        }, 5000);

        const checkConnection = setInterval(() => {
          if (websocketService.isConnected()) {
            clearInterval(checkConnection);
            clearTimeout(timeout);
            result.wsConnected = true;
            result.wsConnectionTime = Date.now() - startTime;
            resolve();
          }
        }, 100);
      });
    } else {
      result.wsConnected = true;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(`❌ Error en diagnóstico: ${errorMessage}`);
    console.error('Error en diagnóstico:', error);
  }
  
  return result;
}

export interface MessageTestConfig {
  websocketUrl: string;
  websocketService: WebSocketServiceInterface;
  groupId: number;
  userId: number;
  testMessage?: string;
}

/**
 * Prueba de envío de mensaje (requiere autenticación previa)
 * 
 * @param config - Configuración con servicio WebSocket y datos inyectados
 */
export async function testMessageSend(
  config: MessageTestConfig
): Promise<boolean> {
  const {
    websocketUrl,
    websocketService,
    groupId,
    userId,
    testMessage = '🧪 Mensaje de prueba',
  } = config;

  try {
    // Autenticar si no está autenticado
    if (!websocketService.isConnected()) {
      websocketService.connect(websocketUrl);
    }

    websocketService.authenticate({
      id_user: userId,
      id_group: groupId,
    });

    // Dar tiempo para autenticarse
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    // Enviar mensaje
    websocketService.sendMessage({
      text_content: testMessage,
    });

    return true;
  } catch (error: unknown) {
    console.error('❌ Error al enviar mensaje de prueba:', error);
    return false;
  }
}

export interface EndpointTestConfig {
  apiUrl: string;
  groupId: number;
  token: string;
  limit?: number;
}

/**
 * Prueba específica del endpoint de mensajes recientes
 * 
 * @param config - Configuración con URL de API y credenciales inyectadas
 */
export async function testRecentMessagesEndpoint(
  config: EndpointTestConfig
): Promise<{ success: boolean; messageCount: number; error?: string }> {
  const { apiUrl, groupId, token, limit = 50 } = config;

  try {
    const endpoint = `${apiUrl}/messages/group/${groupId}/recent?limit=${limit}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      const errorMsg = `Error ${response.status}: ${errorData}`;
      console.error(`❌ ${errorMsg}`);
      return { success: false, messageCount: 0, error: errorMsg };
    }

    const data: unknown = await response.json();
    const messageCount = Array.isArray(data) ? data.length : 0;

    return { success: true, messageCount };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error en prueba: ${errorMsg}`);
    return { success: false, messageCount: 0, error: errorMsg };
  }
}
