import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BaseMessage, parseMentions } from '../BaseMessage';

describe('parseMentions', () => {
  it('returns empty array for empty string', () => {
    expect(parseMentions('')).toEqual([]);
  });

  it('returns plain segment for text without mentions', () => {
    expect(parseMentions('Hello world')).toEqual([
      { value: 'Hello world', isMention: false },
    ]);
  });

  it('parses a single @mention', () => {
    const result = parseMentions('Hi @john');
    expect(result).toEqual([
      { value: 'Hi ', isMention: false },
      { value: '@john', isMention: true },
    ]);
  });

  it('parses multiple @mentions', () => {
    const result = parseMentions('@john and @jane');
    expect(result).toEqual([
      { value: '@john', isMention: true },
      { value: ' and ', isMention: false },
      { value: '@jane', isMention: true },
    ]);
  });

  it('handles mentions with dots and hyphens', () => {
    const result = parseMentions('@john.doe and @jane-smith');
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ value: '@john.doe', isMention: true });
    expect(result[1]).toEqual({ value: ' and ', isMention: false });
    expect(result[2]).toEqual({ value: '@jane-smith', isMention: true });
  });

  it('returns mention-only text', () => {
    expect(parseMentions('@user')).toEqual([
      { value: '@user', isMention: true },
    ]);
  });
});

describe('BaseMessage', () => {
  it('renders plain text', () => {
    const { container } = render(<BaseMessage text="Hello" isOwnMessage={false} />);
    expect(container.textContent).toBe('Hello');
  });

  it('renders nothing for empty text', () => {
    const { container } = render(<BaseMessage text="" isOwnMessage={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for whitespace-only text', () => {
    const { container } = render(<BaseMessage text="   " isOwnMessage={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('highlights @mentions with mention class', () => {
    render(<BaseMessage text="Hello @user" isOwnMessage={false} />);
    const mentionEl = screen.getByText('@user');
    expect(mentionEl.className).toContain('mention');
  });

  it('does not add mention class to plain text', () => {
    render(<BaseMessage text="Hello user" isOwnMessage={false} />);
    const el = screen.getByText('Hello user');
    expect(el.className).not.toContain('mention');
  });

  it('applies ownText class for own messages', () => {
    const { container } = render(<BaseMessage text="Hi" isOwnMessage={true} />);
    expect(container.firstChild?.textContent).toBe('Hi');
    expect((container.firstChild as HTMLElement).className).toContain('ownText');
  });

  it('applies theirText class for others messages', () => {
    const { container } = render(<BaseMessage text="Hi" isOwnMessage={false} />);
    expect((container.firstChild as HTMLElement).className).toContain('theirText');
  });
});
