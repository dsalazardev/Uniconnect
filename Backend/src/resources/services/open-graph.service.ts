import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface OpenGraphData {
  titulo: string;
  descripcion: string | null;
  imagen_preview: string | null;
}

/**
 * CA1: Extrae metadatos Open Graph de una URL externa.
 * Utiliza axios para obtener el HTML y regex para parsear las etiquetas og:*.
 * Fall-back: si og:title no existe usa <title>, si og:image no existe devuelve null.
 */
@Injectable()
export class OpenGraphService {
  private readonly logger = new Logger(OpenGraphService.name);
  private readonly TIMEOUT_MS = 5000;
  private readonly USER_AGENT =
    'Mozilla/5.0 (compatible; Uniconnect-Bot/1.0; +https://uniconnect.app)';

  async extraer(url: string): Promise<OpenGraphData> {
    try {
      const { data: html } = await axios.get<string>(url, {
        timeout: this.TIMEOUT_MS,
        headers: { 'User-Agent': this.USER_AGENT },
        maxRedirects: 5,
        responseType: 'text',
      });

      return {
        titulo: this.extractOgOrFallback(html, 'title', this.extractTitle(html)),
        descripcion: this.extractOg(html, 'description'),
        imagen_preview: this.extractOg(html, 'image'),
      };
    } catch (err) {
      this.logger.warn(`Open Graph extraction failed for ${url}: ${(err as Error).message}`);
      return { titulo: url, descripcion: null, imagen_preview: null };
    }
  }

  private extractOg(html: string, property: string): string | null {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${property}["']`, 'i'),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]) return m[1].trim();
    }
    return null;
  }

  private extractOgOrFallback(html: string, property: string, fallback: string): string {
    return this.extractOg(html, property) ?? fallback;
  }

  private extractTitle(html: string): string {
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return m?.[1]?.trim() ?? 'Sin título';
  }
}
