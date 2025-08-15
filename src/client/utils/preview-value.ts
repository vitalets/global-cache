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
