export type ContentSource = 'srd-5.1' | 'homebrew' | 'user-custom';

export type ContentLicense = 'ogl-1.0a' | 'custom' | 'unknown';

export interface SourceMetadata {
  source: ContentSource;
  license: ContentLicense;
  title?: string;
  author?: string;
  url?: string;
  copyright?: string;
  notes?: string;
}
