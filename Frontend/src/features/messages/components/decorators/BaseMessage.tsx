import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface BaseMessageProps {
  text: string;
  isOwnMessage: boolean;
}

/**
 * Componente base del patrón Decorator.
 * Renderiza el texto del mensaje con soporte para menciones @nombre.
 * Los decoradores (withFileAttachment, withMentions) envuelven este componente.
 */
export const BaseMessage: React.FC<BaseMessageProps> = ({ text, isOwnMessage }) => {
  if (!text?.trim()) return null;

  const segments = parseMentions(text);

  return (
    <Text style={[styles.text, isOwnMessage ? styles.ownText : styles.theirText]}>
      {segments.map((seg, i) =>
        seg.isMention ? (
          <Text key={i} style={styles.mention}>
            {seg.value}
          </Text>
        ) : (
          <Text key={i}>{seg.value}</Text>
        ),
      )}
    </Text>
  );
};

// ── Parser de menciones ────────────────────────────────────────────────────

interface Segment {
  value: string;
  isMention: boolean;
}

/**
 * Divide el texto en segmentos normales y menciones (@nombre).
 * Ejemplo: "Hola @Juan cómo estás" →
 *   [{ value: "Hola ", isMention: false }, { value: "@Juan", isMention: true }, ...]
 */
export function parseMentions(text: string): Segment[] {
  // Captura @palabra (letras, números, guiones, puntos — sin espacios)
  const MENTION_REGEX = /@[\w.\-]+/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ value: text.slice(lastIndex, match.index), isMention: false });
    }
    segments.push({ value: match[0], isMention: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ value: text.slice(lastIndex), isMention: false });
  }

  return segments;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownText: {
    color: '#1a1a1a',
  },
  theirText: {
    color: '#FFFFFF',
  },
  mention: {
    color: '#38BDF8',
    fontWeight: '700',
  },
});
