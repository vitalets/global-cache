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

export function calcSignature({ ttl, stack, fn }: SingatureParams) {
  // todo: use hashing?
  // todo: remove spaces and newlines from stack and computeFn?
  const fnBody = fn.toString().replace(/[\n\s]+/g, ' ');
  const obj: SignatureObj = { ttl, stack, fn: fnBody };

  return JSON.stringify(obj);
}

// eslint-disable-next-line visual/complexity
export function checkSignature(key: string, storedSigStr: string, currentSigStr: string) {
  const storedSig = parseSignatureSafe(storedSigStr);
  const currentSig = parseSignatureSafe(currentSigStr);

  // fallback to string comparison if parsing failed for any of the signatures
  if (!storedSig || !currentSig) {
    return storedSigStr !== currentSigStr
      ? buildErrorMessage(key, 'sig', storedSigStr, currentSigStr)
      : undefined;
  }

  // checking stack first -> allows to navigate to the code by click.
  if (storedSig.stack !== currentSig.stack) {
    return buildErrorMessage(key, 'stack', storedSig.stack, currentSig.stack);
  }

  if (storedSig.ttl !== currentSig.ttl) {
    return buildErrorMessage(key, 'ttl', storedSig.ttl, currentSig.ttl);
  }

  if (storedSig.fn !== currentSig.fn) {
    return buildErrorMessage(key, 'fn', storedSig.fn, currentSig.fn);
  }
}

function parseSignatureSafe(sigStr: string) {
  try {
    return JSON.parse(sigStr) as SignatureObj;
  } catch {
    return null;
  }
}

// eslint-disable-next-line max-params
function buildErrorMessage(key: string, field: string, value1: unknown, value2: unknown) {
  return [
    `Signature mismatch (${field}). `,
    `Please ensure you don't call globalCache.get("${key}") from multiple places.\n`,
    `1-st call ${field}: ${value1}\n`,
    `2-nd call ${field}: ${value2}`,
  ].join('');
}
