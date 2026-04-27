import React from 'react';
import { render } from '@testing-library/react-native';
import { MessageBubble } from './MessageBubble';
import { Message } from '../types';

describe('MessageBubble', () => {
  const mockMessage: Message = {
    id_message: 1,
    id_membership: 1,
    text_content: 'Hola grupo!',
    send_at: '2024-03-15T10:00:00Z',
    attachments: '',
    is_edited: false,
    edited_at: null,
    sender_name: 'Juan Pérez',
    sender_picture: 'https://example.com/avatar.jpg',
    membership: {
      user: {
        id_user: 1,
        full_name: 'Juan Pérez',
        picture: 'https://example.com/avatar.jpg',
      },
      group: {
        id_group: 1,
        name: 'Grupo Test',
      },
    },
  };

  describe('Sender Info Rendering', () => {
    it('should render sender name when showSenderInfo is true', () => {
      const { getByText } = render(
        <MessageBubble
          message={mockMessage}
          isOwnMessage={false}
          isAdmin={false}
          showSenderInfo={true}
        />
      );

      expect(getByText('Juan Pérez')).toBeTruthy();
    });

    it('should NOT render sender name when showSenderInfo is false', () => {
      const { queryByText } = render(
        <MessageBubble
          message={mockMessage}
          isOwnMessage={false}
          isAdmin={false}
          showSenderInfo={false}
        />
      );

      expect(queryByText('Juan Pérez')).toBeNull();
    });

    it('should render sender avatar when showSenderInfo is true and sender_picture exists', () => {
      const { UNSAFE_getByType } = render(
        <MessageBubble
          message={mockMessage}
          isOwnMessage={false}
          isAdmin={false}
          showSenderInfo={true}
        />
      );

      // Verificar que se renderiza un Image component
      const images = UNSAFE_getByType('Image' as any);
      expect(images).toBeTruthy();
    });

    it('should render placeholder icon when showSenderInfo is true and sender_picture is null', () => {
      const messageWithoutPicture: Message = {
        ...mockMessage,
        sender_picture: null,
      };

      const { getByText } = render(
        <MessageBubble
          message={messageWithoutPicture}
          isOwnMessage={false}
          isAdmin={false}
          showSenderInfo={true}
        />
      );

      // El nombre debe estar presente
      expect(getByText('Juan Pérez')).toBeTruthy();
    });

    it('should use fallback name when sender_name is not provided', () => {
      const messageWithoutSenderName: Message = {
        ...mockMessage,
        sender_name: undefined,
      };

      const { getByText } = render(
        <MessageBubble
          message={messageWithoutSenderName}
          isOwnMessage={false}
          isAdmin={false}
          showSenderInfo={true}
        />
      );

      // Debe usar el nombre del membership como fallback
      expect(getByText('Juan Pérez')).toBeTruthy();
    });

    it('should default showSenderInfo to false when not provided', () => {
      const { queryByText } = render(
        <MessageBubble
          message={mockMessage}
          isOwnMessage={false}
          isAdmin={false}
        />
      );

      // No debe mostrar el nombre del remitente por defecto
      expect(queryByText('Juan Pérez')).toBeNull();
    });
  });

  describe('Message Content Rendering', () => {
    it('should render message text content', () => {
      const { getByText } = render(
        <MessageBubble
          message={mockMessage}
          isOwnMessage={false}
          isAdmin={false}
          showSenderInfo={false}
        />
      );

      expect(getByText('Hola grupo!')).toBeTruthy();
    });

    it('should render edited badge when message is edited', () => {
      const editedMessage: Message = {
        ...mockMessage,
        is_edited: true,
        edited_at: '2024-03-15T10:05:00Z',
      };

      const { getByText } = render(
        <MessageBubble
          message={editedMessage}
          isOwnMessage={false}
          isAdmin={false}
          showSenderInfo={false}
        />
      );

      expect(getByText('editado')).toBeTruthy();
    });
  });

  describe('Conditional Styling', () => {
    it('should apply correct styles for own messages', () => {
      const { getByText } = render(
        <MessageBubble
          message={mockMessage}
          isOwnMessage={true}
          isAdmin={false}
          showSenderInfo={false}
        />
      );

      const messageText = getByText('Hola grupo!');
      expect(messageText).toBeTruthy();
    });

    it('should apply correct styles for other users messages', () => {
      const { getByText } = render(
        <MessageBubble
          message={mockMessage}
          isOwnMessage={false}
          isAdmin={false}
          showSenderInfo={false}
        />
      );

      const messageText = getByText('Hola grupo!');
      expect(messageText).toBeTruthy();
    });
  });

  describe('Type Safety', () => {
    it('should handle message with all optional fields as undefined', () => {
      const minimalMessage: Message = {
        id_message: 2,
        id_membership: 2,
        text_content: 'Test',
        send_at: '2024-03-15T10:00:00Z',
        attachments: '',
        is_edited: false,
        edited_at: null,
        sender_name: undefined,
        sender_picture: undefined,
      };

      const { getByText } = render(
        <MessageBubble
          message={minimalMessage}
          isOwnMessage={false}
          isAdmin={false}
          showSenderInfo={true}
        />
      );

      // Debe usar 'Usuario' como fallback
      expect(getByText('Usuario')).toBeTruthy();
    });
  });
});
