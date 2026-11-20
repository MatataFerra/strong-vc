/** Produces a filename safe for any filesystem: lowercase, [a-z0-9-_], max 64 chars before the extension. */
export function safeFilename(base: string, ext: string): string {
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 64);
  const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleaned || 'export'}.${safeExt}`;
}
