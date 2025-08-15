export async function buildHttpError(res: Response, prefix: string) {
  const message = (await res.text()) || `${res.status} ${res.statusText}`;
  return new Error(`${prefix} ${message}`);
}

export async function throwIfHttpError(res: Response, message: string) {
  if (!res.ok) throw await buildHttpError(res, message);
}
