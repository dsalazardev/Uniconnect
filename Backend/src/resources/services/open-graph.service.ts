import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface OpenGraphData {
  titulo: string;
  descripcion: string | null;
  imagen_preview: string | null;
}

/**
 * CA1: Extrae metadatos Open Graph / meta básicos de una URL externa.
 * Cubre og:*, twitter:* y meta name= como fallback.
 */
@Injectable()
export class OpenGraphService {
  private readonly logger = new Logger(OpenGraphService.name);
  private readonly TIMEOUT_MS = 4000;
  private readonly MAX_CONTENT_BYTES = 500_000; // 500 KB — suficiente para el <head>
  private readonly USER_AGENT =
    'Mozilla/5.0 (compatible; Uniconnect/1.0)';

  async extraer(url: string): Promise<OpenGraphData> {
    try {
      const { data: html } = await axios.get<string>(url, {
        timeout: this.TIMEOUT_MS,
        maxContentLength: this.MAX_CONTENT_BYTES,
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'es,en;q=0.9',
        },
        maxRedirects: 3,
        responseType: 'text',
      });

      // Solo parsear el <head> para ser más rápido y preciso
      const head = html.slice(0, Math.min(html.length, 20_000));

      const titulo =
        this.extractMeta(head, 'og:title') ??
        this.extractMeta(head, 'twitter:title') ??
        this.extractTitle(head) ??
        this.hostnameOf(url);

      const descripcion =
        this.extractMeta(head, 'og:description') ??
        this.extractMeta(head, 'twitter:description') ??
        this.extractMetaName(head, 'description');

      const imagen_preview =
        this.extractMeta(head, 'og:image:secure_url') ??
        this.extractMeta(head, 'og:image') ??
        this.extractMeta(head, 'twitter:image');

      return { titulo, descripcion, imagen_preview };
    } catch (err) {
      this.logger.warn(`OG extraction failed for ${url}: ${(err as Error).message}`);
      return { titulo: this.hostnameOf(url), descripcion: null, imagen_preview: null };
    }
  }

  /** Extrae meta con property= o name= igual al valor buscado */
  private extractMeta(html: string, key: string): string | null {
    // Prueba las cuatro combinaciones de orden (property|name) × (content antes|después)
    const patterns = [
      // property/name antes que content
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${this.esc(key)}["'][^>]+content=["']([^"'<>]+)["']`,
        'i',
      ),
      // content antes que property/name
      new RegExp(
        `<meta[^>]+content=["']([^"'<>]+)["'][^>]+(?:property|name)=["']${this.esc(key)}["']`,
        'i',
      ),
    ];

    for (const re of patterns) {
      const m = html.match(re);
      const val = m?.[1]?.trim();
      if (val) return this.decodeHtml(val);
    }
    return null;
  }

  /** Extrae meta con name= exacto (para description, keywords, etc.) */
  private extractMetaName(html: string, name: string): string | null {
    return this.extractMeta(html, name);
  }

  private extractTitle(html: string): string | null {
    const m = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i);
    return m?.[1]?.trim() ? this.decodeHtml(m[1].trim()) : null;
  }

  private hostnameOf(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  /** Decodifica entidades HTML básicas */
  private decodeHtml(str: string): string {
    return str
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&nbsp;/gi, ' ');
  }

  private esc(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
