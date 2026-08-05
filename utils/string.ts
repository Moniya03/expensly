/** Capitalize the first letter of a sentence ("had chai" -> "Had chai"). */
export function sentenceCase(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
