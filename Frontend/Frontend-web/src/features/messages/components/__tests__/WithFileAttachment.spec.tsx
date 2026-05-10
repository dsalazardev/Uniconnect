import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WithFileAttachment } from '../WithFileAttachment';
import type { MessageFile } from '@uniconnect/shared';

const makeImageFile = (overrides: Partial<MessageFile> = {}): MessageFile => ({
  id_file: 1,
  url: 'https://example.com/image.jpg',
  file_name: 'photo.jpg',
  mime_type: 'image/jpeg',
  size: 102400,
  ...overrides,
});

const makePdfFile = (overrides: Partial<MessageFile> = {}): MessageFile => ({
  id_file: 2,
  url: 'https://example.com/doc.pdf',
  file_name: 'document.pdf',
  mime_type: 'application/pdf',
  size: 204800,
  ...overrides,
});

const makeDocFile = (overrides: Partial<MessageFile> = {}): MessageFile => ({
  id_file: 3,
  url: 'https://example.com/doc.docx',
  file_name: 'report.docx',
  mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  size: 51200,
  ...overrides,
});

const makeVideoFile = (overrides: Partial<MessageFile> = {}): MessageFile => ({
  id_file: 4,
  url: 'https://example.com/video.mp4',
  file_name: 'video.mp4',
  mime_type: 'video/mp4',
  size: 10485760,
  ...overrides,
});

describe('WithFileAttachment', () => {
  it('renders children when no files', () => {
    render(
      <WithFileAttachment files={[]}>
        <span>No files</span>
      </WithFileAttachment>,
    );
    expect(screen.getByText('No files')).toBeInTheDocument();
  });

  it('renders children and file list', () => {
    render(
      <WithFileAttachment files={[makePdfFile()]}>
        <span>Message text</span>
      </WithFileAttachment>,
    );
    expect(screen.getByText('Message text')).toBeInTheDocument();
    expect(screen.getByLabelText('Descargar document.pdf')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  it('renders image preview for image files', () => {
    const file = makeImageFile();
    render(
      <WithFileAttachment files={[file]}>
        <span>With image</span>
      </WithFileAttachment>,
    );
    const img = screen.getByAltText('photo.jpg');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', file.url);
  });

  it('renders download overlay on image', () => {
    render(
      <WithFileAttachment files={[makeImageFile()]}>
        <span>Image</span>
      </WithFileAttachment>,
    );
    expect(screen.getByLabelText('Descargar imagen')).toBeInTheDocument();
  });

  it('renders PDF with correct icon', () => {
    render(
      <WithFileAttachment files={[makePdfFile()]}>
        <span>PDF</span>
      </WithFileAttachment>,
    );
    expect(screen.getByLabelText('Descargar document.pdf')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('200 KB')).toBeInTheDocument();
  });

  it('renders video files with video icon', () => {
    render(
      <WithFileAttachment files={[makeVideoFile()]}>
        <span>Video</span>
      </WithFileAttachment>,
    );
    expect(screen.getByText('video.mp4')).toBeInTheDocument();
    expect(screen.getByText('10 MB')).toBeInTheDocument();
  });

  it('renders document files with Word icon', () => {
    render(
      <WithFileAttachment files={[makeDocFile()]}>
        <span>Doc</span>
      </WithFileAttachment>,
    );
    expect(screen.getByText('report.docx')).toBeInTheDocument();
    expect(screen.getByText('50 KB')).toBeInTheDocument();
  });

  it('renders multiple files', () => {
    render(
      <WithFileAttachment files={[makePdfFile(), makeImageFile()]}>
        <span>Multiple files</span>
      </WithFileAttachment>,
    );
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByAltText('photo.jpg')).toBeInTheDocument();
  });

  it('calls onFilePress when file is clicked', () => {
    const onPress = vi.fn();
    render(
      <WithFileAttachment files={[makePdfFile()]} onFilePress={onPress}>
        <span>Clickable</span>
      </WithFileAttachment>,
    );
    screen.getByLabelText('Descargar document.pdf').click();
    expect(onPress).toHaveBeenCalledWith({ id_file: 2, file_name: 'document.pdf' });
  });

  it('formats file size as "0 B" for zero bytes', () => {
    render(
      <WithFileAttachment files={[makePdfFile({ size: 0 })]}>
        <span>Zero bytes</span>
      </WithFileAttachment>,
    );
    expect(screen.getByText('0 B')).toBeInTheDocument();
  });
});
