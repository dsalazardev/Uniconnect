/**
 * Utilidades de debug para diagnosticar problemas de mensajería
 */

import { websocketService } from '../services/websocket.service';
import { messagesService } from '../services/messages.service';
import { WEBSOCKET_URL, API_BASE_URL } from '@/src/constants/api';

export interface DiagnosticResult {
  timestamp: string;
  websocketUrl: string;
  apiUrl: string;
  wsConnected: boolean;
  wsConnectionTime?: number;
  apiHealthy: boolean;
  errors: string[];
}

/**
 * Ejecutar diagnóstico completo de la mensajería
 */
export async function runMessagingDiagnostics(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    websocketUrl: WEBSOCKET_URL,
    apiUrl: API_BASE_URL,
    wsConnected: false,
    apiHealthy: false,
    errors,
  };

  console.log('🔍 Iniciando diagnóstico de mensajería...');
  console.log(`   WebSocket URL: ${WEBSOCKET_URL}`);
  console.log(`   API URL: ${API_BASE_URL}`);

  try {
    // 1. Verificar conectividad API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      result.apiHealthy = response.ok;
      if (!response.ok) {
        errors.push(`⚠️ API respondió con estado: ${response.status}`);
      } else {
        console.log('✅ API accesible');
      }
    } catch (apiError: any) {
      errors.push(`❌ Error conectando a API: ${apiError.message}`);
      console.error('Error de API:', apiError);
    }

    // 2. Verificar WebSocket
    if (!websocketService.isConnected()) {
      console.log('⏳ Conectando al WebSocket...');
      websocketService.connect(WEBSOCKET_URL);
      
      // Esperar a que conecte
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          errors.push('❌ WebSocket no conectó en 5 segundos');
          resolve(null);
        }, 5000);

        const checkConnection = setInterval(() => {
          if (websocketService.isConnected()) {
            clearInterval(checkConnection);
            clearTimeout(timeout);
            result.wsConnected = true;
            result.wsConnectionTime = Date.now() - startTime;
            console.log(`✅ WebSocket conectado en ${result.wsConnectionTime}ms`);
            resolve(null);
          }
        }, 100);
      });
    } else {
      result.wsConnected = true;
      console.log('✅ WebSocket ya estaba conectado');
    }
  } catch (error: any) {
    errors.push(`❌ Error en diagnóstico: ${error.message}`);
    console.error('Error en diagnóstico:', error);
  }

  if (errors.length === 0) {
    console.log('✅ Diagnóstico completado sin errores');
  } else {
    console.log(`⚠️ Diagnóstico completado con ${errors.length} problema(s)`);
  }

  return result;
}

/**
 * Prueba de envío de mensaje (requiere autenticación previa)
 */
export async function testMessageSend(
  groupId: number,
  userId: number,
  token: string,
  testMessage: string = '🧪 Mensaje de prueba'
): Promise<boolean> {
  try {
    console.log(`📤 Enviando mensaje de prueba al grupo ${groupId}...`);
    
    // Autenticar si no está autenticado
    if (!websocketService.isConnected()) {
      websocketService.connect(WEBSOCKET_URL);
    }

    websocketService.authenticate({
      id_user: userId,
      id_group: groupId,
    });

    // Dar tiempo para autenticarse
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Enviar mensaje
    websocketService.sendMessage({
      text_content: testMessage,
    });

    console.log('✅ Mensaje de prueba enviado');
    return true;
  } catch (error: any) {
    console.error('❌ Error al enviar mensaje de prueba:', error);
    return false;
  }
}

/**
 * Verificar configuración de variables de entorno
 */
export function checkEnvironmentVariables(): {
  apiUrl: string | undefined;
  configured: boolean;
} {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  return {
    apiUrl,
    configured: !!apiUrl,
  };
}

/**
 * Log detallado de estado de WebSocket
 */
export function logWebSocketStatus(): void {
  console.log('📊 Estado del WebSocket:');
  console.log(`   Conectado: ${websocketService.isConnected()}`);
  console.log(`   Grupo actual: ${websocketService.getCurrentGroupId()}`);
  console.log(`   Usuario actual: ${websocketService.getCurrentUserId()}`);
}

/**
 * Ver todas las URLs configuradas
 */
export function logConfiguredUrls(): void {
  console.log('🔗 URLs Configuradas:');
  console.log(`   API Base: ${API_BASE_URL}`);
  console.log(`   WebSocket: ${WEBSOCKET_URL}`);
  console.log(`   Env - EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL || 'no configurada'}`);
}

/**
 * Prueba específica del endpoint de mensajes recientes
 */
export async function testRecentMessagesEndpoint(
  groupId: number,
  token: string,
  limit: number = 50
): Promise<{ success: boolean; messageCount: number; error?: string }> {
  try {
    const endpoint = `${API_BASE_URL}/messages/group/${groupId}/recent?limit=${limit}`;
    console.log(`🔍 Probando endpoint de mensajes recientes...`);
    console.log(`   URL: ${endpoint}`);
    console.log(`   Grupo ID: ${groupId}`);
    console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'NO PRESENTE'}`);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      const errorMsg = `Error ${response.status}: ${errorData}`;
      console.error(`❌ ${errorMsg}`);
      return { success: false, messageCount: 0, error: errorMsg };
    }

    const data = await response.json();
    const messageCount = Array.isArray(data) ? data.length : 0;
    console.log(`✅ Éxito - ${messageCount} mensajes obtenidos`);
    console.log(`   Mensajes:`, data);
    
    return { success: true, messageCount };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.error(`❌ Error en prueba: ${errorMsg}`);
    return { success: false, messageCount: 0, error: errorMsg };
  }
}
