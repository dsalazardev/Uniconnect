import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WithMentionsProps {
  text: string;
  currentUserName?: string;
  children: React.ReactNode;
}

/**
 * Decorador de menciones (Patrón Decorator).
 * Si el texto contiene una mención al usuario actual (@nombre),
 * añade un borde de acento y un icono de notificación visual
 * para diferenciar el mensaje de los normales.
 *
 * El resaltado del texto @nombre lo hace BaseMessage internamente.
 * Este decorador solo añade el tratamiento visual de la burbuja completa.
 */
export const WithMentions: React.FC<WithMentionsProps> = ({
  text,
  currentUserName,
  children,
}) => {
  const isMentioned = currentUserName
    ? containsMention(text, currentUserName)
    : false;

  if (!isMentioned) {
    return <>{children}</>;
  }

  return (
    <View style={styles.mentionWrapper}>
      <View style={styles.mentionAccent} />
      <View style={styles.content}>
        {children}
      </View>
      <Ionicons
        name="at-circle"
        size={14}
        color="#38BDF8"
        style={styles.mentionIcon}
      />
    </View>
  );
};

/**
 * Verifica si el texto menciona al usuario actual.
 * Normaliza el nombre: "Juan García" → busca @Juan o @JuanGarcía
 */
export function containsMention(text: string, fullName: string): boolean {
  if (!text || !fullName) return false;
  const firstName = fullName.split(' ')[0];
  const noSpaces = fullName.replace(/\s+/g, '');
  const pattern = new RegExp(`@(${escapeRegex(firstName)}|${escapeRegex(noSpaces)})\\b`, 'i');
  return pattern.test(text);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const styles = StyleSheet.create({
  mentionWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  mentionAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
    marginRight: 6,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
  },
  mentionIcon: {
    marginLeft: 4,
    marginTop: 2,
  },
});
