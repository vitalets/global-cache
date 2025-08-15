/**
 * Calculate the calling signature for a given key:
 * ttl + stack + computeFn body
 *
 * Signature is used to invalidate the key in case of changes in the calling code.
 * Signature is computed on client and sent to the server.
 * Server compares the signature with the stored one and invalidates the key if they differ.
 */

import { TTL } from './ttl';

export type SingatureParams = {
  stack: string;
  fn: Function; // eslint-disable-line @typescript-eslint/no-unsafe-function-type
  ttl?: TTL;
};

export function calcSignature({ ttl, stack, fn }: SingatureParams) {
  // todo: use hashing?
  // todo: remove spaces and newlines from stack and computeFn?
  const fnBody = fn.toString().replace(/[\n\s]+/g, ' ');
  return `${String(ttl)}:${stack}:${fnBody}`;
}
