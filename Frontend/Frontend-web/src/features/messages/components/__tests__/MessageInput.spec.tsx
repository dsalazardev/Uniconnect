import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageInput } from '../MessageInput';

vi.mock('@/constants/api', () => ({
  api: {
    post: vi.fn(),
    interceptors: { request: { use: vi.fn(), eject: vi.fn() }, response: { use: vi.fn(), eject: vi.fn() } },
  },
}));

describe('MessageInput', () => {
  it('renders textarea and send button', () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText('Escribe un mensaje...')).toBeInTheDocument();
    expect(screen.getByLabelText('Enviar mensaje')).toBeInTheDocument();
  });

  it('renders emoji toggle button', () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByLabelText('Emoji')).toBeInTheDocument();
  });

  it('sends text on submit', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar mensaje' }));
    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('clears text after sending', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar mensaje' }));
    expect((input as HTMLTextAreaElement).value).toBe('');
  });

  it('disables send button when text is empty', () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByLabelText('Enviar mensaje')).toBeDisabled();
  });

  it('enables send button when text is not empty', () => {
    render(<MessageInput onSend={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Escribe un mensaje...'), {
      target: { value: 'Hi' },
    });
    expect(screen.getByLabelText('Enviar mensaje')).not.toBeDisabled();
  });

  it('shows edit indicator when editing', () => {
    render(
      <MessageInput
        onSend={vi.fn()}
        editingMessageId={42}
        initialText="Editing this"
      />,
    );
    expect(screen.getByText('Editando mensaje')).toBeInTheDocument();
    expect(screen.getByLabelText('Cancelar edición')).toBeInTheDocument();
  });

  it('shows initial text when editing', () => {
    render(
      <MessageInput
        onSend={vi.fn()}
        editingMessageId={42}
        initialText="Original text"
      />,
    );
    const input = screen.getByPlaceholderText('Edita el mensaje...');
    expect((input as HTMLTextAreaElement).value).toBe('Original text');
  });

  it('calls onCancelEdit when cancel edit clicked', () => {
    const onCancel = vi.fn();
    render(
      <MessageInput
        onSend={vi.fn()}
        editingMessageId={42}
        onCancelEdit={onCancel}
      />,
    );
    fireEvent.click(screen.getByLabelText('Cancelar edición'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('sends text on Enter', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    fireEvent.change(input, { target: { value: 'By Enter' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('By Enter');
  });

  it('does not send on Shift+Enter', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    fireEvent.change(input, { target: { value: 'Shift+Enter' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('handles Escape key during editing', () => {
    const onCancel = vi.fn();
    render(
      <MessageInput
        onSend={vi.fn()}
        editingMessageId={42}
        initialText="Editable"
        onCancelEdit={onCancel}
      />,
    );
    const input = screen.getByPlaceholderText('Edita el mensaje...');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('toggles emoji picker on button click', () => {
    render(<MessageInput onSend={vi.fn()} />);
    const emojiBtn = screen.getByLabelText('Emoji');
    fireEvent.click(emojiBtn);
    expect(screen.getByText('😀')).toBeInTheDocument();
    fireEvent.click(emojiBtn);
    expect(screen.queryByText('😀')).not.toBeInTheDocument();
  });

  it('inserts emoji at cursor position and closes picker', () => {
    render(<MessageInput onSend={vi.fn()} />);
    const input = screen.getByPlaceholderText('Escribe un mensaje...') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Hi' } });
    input.setSelectionRange(2, 2);

    fireEvent.click(screen.getByLabelText('Emoji'));
    fireEvent.click(screen.getByText('😀'));
    expect(input.value).toBe('Hi😀');
    expect(screen.queryByText('😀')).not.toBeInTheDocument();
  });

  it('closes emoji picker with Escape', () => {
    render(<MessageInput onSend={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Emoji'));
    expect(screen.getByText('😀')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByPlaceholderText('Escribe un mensaje...'), {
      key: 'Escape',
    });
    expect(screen.queryByText('😀')).not.toBeInTheDocument();
  });

  it('disables emoji toggle when disabled prop is true', () => {
    render(<MessageInput onSend={vi.fn()} disabled={true} />);
    expect(screen.getByLabelText('Emoji')).toBeDisabled();
  });

  it('shows attach button when groupId is provided and not editing', () => {
    render(<MessageInput onSend={vi.fn()} groupId={1} />);
    expect(screen.getByLabelText('Adjuntar archivo')).toBeInTheDocument();
  });

  it('hides attach button when editing', () => {
    render(
      <MessageInput
        onSend={vi.fn()}
        groupId={1}
        editingMessageId={42}
      />,
    );
    expect(screen.queryByLabelText('Adjuntar archivo')).not.toBeInTheDocument();
  });

  it('does not submit when disabled', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} disabled={true} />);
    const input = screen.getByPlaceholderText('Escribe un mensaje...');
    fireEvent.change(input, { target: { value: 'Text' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar mensaje' }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not submit empty text', () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    fireEvent.submit(screen.getByRole('button', { name: 'Enviar mensaje' }));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('calls onTyping when text changes', () => {
    const onTyping = vi.fn();
    render(<MessageInput onSend={vi.fn()} onTyping={onTyping} />);
    fireEvent.change(screen.getByPlaceholderText('Escribe un mensaje...'), {
      target: { value: 'T' },
    });
    expect(onTyping).toHaveBeenCalled();
  });
});
