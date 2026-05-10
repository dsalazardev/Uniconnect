import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WithMentions, containsMention } from '../WithMentions';

describe('containsMention', () => {
  it('returns false for empty text', () => {
    expect(containsMention('', 'John Doe')).toBe(false);
  });

  it('returns false for empty name', () => {
    expect(containsMention('@john', '')).toBe(false);
  });

  it('matches @firstname', () => {
    expect(containsMention('Hey @John', 'John Doe')).toBe(true);
  });

  it('matches @firstname case-insensitively', () => {
    expect(containsMention('Hey @john', 'John Doe')).toBe(true);
  });

  it('matches @fullnamenospaces', () => {
    expect(containsMention('@JohnDoe check this', 'John Doe')).toBe(true);
  });

  it('returns false when no match', () => {
    expect(containsMention('Hey @Jane', 'John Doe')).toBe(false);
  });

  it('handles special regex characters in names', () => {
    expect(containsMention('@Mario', 'Mario (Luigi)')).toBe(true);
  });
});

describe('WithMentions', () => {
  const childContent = <span>Inner content</span>;

  it('renders children when not mentioned', () => {
    render(
      <WithMentions text="Hello" currentUserName="John Doe">
        {childContent}
      </WithMentions>,
    );
    expect(screen.getByText('Inner content')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders children with mention accent when mentioned', () => {
    render(
      <WithMentions text="Hey @John" currentUserName="John Doe">
        {childContent}
      </WithMentions>,
    );
    expect(screen.getByText('Inner content')).toBeInTheDocument();
  });

  it('renders mention icon when user is mentioned', () => {
    const { container } = render(
      <WithMentions text="@John check this" currentUserName="John Doe">
        {childContent}
      </WithMentions>,
    );
    const iconContainer = container.querySelector('[class*="mentionWrapper"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders plain children when currentUserName is not provided', () => {
    render(
      <WithMentions text="@John">
        {childContent}
      </WithMentions>,
    );
    expect(screen.getByText('Inner content')).toBeInTheDocument();
  });
});
