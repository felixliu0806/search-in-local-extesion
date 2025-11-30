export function splitIntoSentences(text: string): string[] {
  if (!text.trim()) {
    return [];
  }
  const normalized = text.replace(/\s+/g, ' ').trim();
  const pieces = normalized.split(/(?<=[.!?\u3002\uff01\uff1f])/u);
  return pieces.map((part) => part.trim()).filter(Boolean);
}
