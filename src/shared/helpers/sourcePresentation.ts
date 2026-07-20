export function isBuiltInRulesSource(source: string | null | undefined): boolean {
  return source === 'srd-5.1';
}

export function shouldDisplaySourceMetadata(source: string | null | undefined): source is string {
  return Boolean(source) && !isBuiltInRulesSource(source);
}
