export function stringifyValue(value: unknown): string {
  // undefined value is stored as empty string
  return value === undefined ? '' : JSON.stringify(value, null, 2);
}

export function parseValue(content: string) {
  return content ? JSON.parse(content) : undefined;
}

/**
 * Important to use readValue instead of res.json() to better handle undefined/null.
 */
export async function readValue(res: Response) {
  const text = await res.text();
  return parseValue(text);
}

export function previewValue(value: unknown) {
  try {
    if (value === undefined) return '<undefined>';
    const strValue = JSON.stringify(value);
    return strValue.length > 50 ? `${strValue.slice(0, 50)}...` : strValue;
  } catch {
    // Fallback for non-serializable values
    return `<non-serializable>`;
  }
}
