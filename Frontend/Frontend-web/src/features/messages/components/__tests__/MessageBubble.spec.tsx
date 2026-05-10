import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageBubble } from '../MessageBubble';
import type { Message } from '@uniconnect/shared';

const baseMessage: Message = {
  id_message: 1,
  text_content: 'Hello world',
  send_at: '2026-05-09T12:00:00Z',
  is_edited: false,
  files: [],
  membership: {
    id_membership: 1,
    user: { id_user: 1, full_name: 'John Doe' },
  },
  sender_name: 'John Doe',
  sender_picture: null,
};

describe('MessageBubble', () => {
  it('renders text content', () => {
    render(<MessageBubble message={baseMessage} isOwnMessage={false} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders time formatted in HH:MM', () => {
    render(<MessageBubble message={baseMessage} isOwnMessage={false} />);
    const timeEl = screen.getByText(/^\d{2}:\d{2}$/);
    expect(timeEl).toBeInTheDocument();
  });

  it('shows edited badge when message is edited', () => {
    render(
      <MessageBubble
        message={{ ...baseMessage, is_edited: true }}
        isOwnMessage={false}
      />,
    );
    expect(screen.getByText('editado')).toBeInTheDocument();
  });

  it('does not show edited badge when not edited', () => {
    render(<MessageBubble message={baseMessage} isOwnMessage={false} />);
    expect(screen.queryByText('editado')).not.toBeInTheDocument();
  });

  it('shows sender info when showSenderInfo is true', () => {
    render(
      <MessageBubble message={baseMessage} isOwnMessage={false} showSenderInfo={true} />,
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('does not show sender info when showSenderInfo is false', () => {
    render(<MessageBubble message={baseMessage} isOwnMessage={false} />);
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('renders avatar placeholder when no sender picture', () => {
    render(
      <MessageBubble message={baseMessage} isOwnMessage={false} showSenderInfo={true} />,
    );
    const avatarContainer = screen.getByText('John Doe').closest('[class*="senderInfo"]');
    expect(avatarContainer?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders sender image when picture exists', () => {
    const msg = { ...baseMessage, sender_picture: 'https://example.com/avatar.jpg' };
    render(
      <MessageBubble message={msg} isOwnMessage={false} showSenderInfo={true} />,
    );
    const img = screen.getByAltText('');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('wraps content in WithMentions and WithFileAttachment', () => {
    const msg = {
      ...baseMessage,
      text_content: '@John check this',
      files: [{
        id_file: 5,
        url: 'https://example.com/file.pdf',
        file_name: 'doc.pdf',
        mime_type: 'application/pdf',
        size: 1000,
      }],
    };
    render(<MessageBubble message={msg} isOwnMessage={false} currentUserName="John Doe" />);
    expect(screen.getByText('@John')).toBeInTheDocument();
  });

  it('applies mineBubble class for own messages', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} isOwnMessage={true} />,
    );
    const bubble = container.querySelector('[class*="mineBubble"]');
    expect(bubble).toBeInTheDocument();
  });

  it('applies theirsBubble class for others messages', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} isOwnMessage={false} />,
    );
    const bubble = container.querySelector('[class*="theirsBubble"]');
    expect(bubble).toBeInTheDocument();
  });

  it('does not render bubble when text is empty and no files', () => {
    const { container } = render(
      <MessageBubble message={{ ...baseMessage, text_content: '' }} isOwnMessage={false} />,
    );
    const bubble = container.querySelector('[class*="bubble"]');
    expect(bubble).not.toBeInTheDocument();
  });
});
