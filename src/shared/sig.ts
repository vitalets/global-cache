/**
 * Calculate the calling signature for a given key:
 * ttl + stack + computeFn body
 *
 * Signature is used to invalidate the key in case of changes in the calling code.
 * Signature is computed on client and sent to the server.
 * Server compares the signature with the stored one and invalidates the key if they differ.
 */

import { TTL } from './ttl';

type SingatureParams = {
  fn: Function; // eslint-disable-line @typescript-eslint/no-unsafe-function-type
  stack: string;
  ttl?: TTL;
};

type SignatureObj = {
  fn: string;
  stack: string;
  ttl?: TTL;
};

export type SignatureMismatch = {
  field: 'fn' | 'stack' | 'ttl' | 'sig';
  value1: unknown;
  value2: unknown;
};

export function calcSignature({ ttl, stack, fn }: SingatureParams) {
  // todo: use hashing?
  // todo: remove spaces and newlines from stack and computeFn?
  const fnBody = fn.toString().replace(/[\n\s]+/g, ' ');
  const obj: SignatureObj = { ttl, stack, fn: fnBody };

  return JSON.stringify(obj);
}

// eslint-disable-next-line visual/complexity
export function checkSignature(
  key: string,
  storedSigStr: string,
  currentSigStr: string,
): SignatureMismatch | undefined {
  const storedSig = parseSignatureSafe(storedSigStr);
  const currentSig = parseSignatureSafe(currentSigStr);

  // fallback to string comparison if parsing failed for any of the signatures
  // todo: remove in the future releases
  if (!storedSig || !currentSig) {
    return storedSigStr !== currentSigStr
      ? createSignatureMismatch('sig', storedSigStr, currentSigStr)
      : undefined;
  }

  // checking stack first -> allows to navigate to the code by click in IDE.
  if (storedSig.stack !== currentSig.stack) {
    return createSignatureMismatch('stack', storedSig.stack, currentSig.stack);
  }

  if (storedSig.ttl !== currentSig.ttl) {
    return createSignatureMismatch('ttl', storedSig.ttl, currentSig.ttl);
  }

  if (storedSig.fn !== currentSig.fn) {
    return createSignatureMismatch('fn', storedSig.fn, currentSig.fn);
  }
}

function createSignatureMismatch(
  field: SignatureMismatch['field'],
  value1: unknown,
  value2: unknown,
): SignatureMismatch {
  return { field, value1, value2 };
}

function parseSignatureSafe(sigStr: string) {
  try {
    return JSON.parse(sigStr) as SignatureObj;
  } catch {
    return null;
  }
}
