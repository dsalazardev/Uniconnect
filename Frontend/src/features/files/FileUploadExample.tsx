/**
 * Ejemplo de implementación del componente FileUploadComponent
 * en una pantalla (usualmente dentro de messages o grupos)
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { FileUploadComponent } from '../../components/FileUploadComponent';
import { FileData, FileUploadError } from '../../types/files';

/**
 * Ejemplo de uso en una pantalla de grupo o de mensajes
 * Reemplaza los valores de id_group e id_message según tu contexto
 */
export const FileUploadExampleScreen = () => {
  // Ejemplo: obtener estos IDs de params de navegación o contexto
  const id_group = '15'; // O número
  const id_message = '4'; // Opcional

  const handleUploadSuccess = (uploadedFiles: FileData[]) => {
    
    // Aquí puedes:
    // - Refrescar la lista de mensajes
    // - Actualizar el contexto/state
    // - Navegar a otra pantalla
    // - Mostrar notificación
  };

  const handleUploadError = (error: FileUploadError) => {
    console.error('Upload failed:', error);
    // Aquí puedes:
    // - Loguear el error
    // - Enviar a un servicio de analytics
    // - Mostrar un error más detallado al usuario
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <FileUploadComponent
          id_group={id_group}
          id_message={id_message}
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingVertical: 16,
  },
});
