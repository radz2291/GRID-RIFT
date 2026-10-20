import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
/** Build-only replacement for Node's hashing adapter; identical SHA-256 bytes. */
export function createHash(algorithm:string) {
  if(algorithm!=='sha256') throw new Error('Unsupported browser hash');
  const state=sha256.create();
  return {
    update(value:string|Uint8Array) {state.update(typeof value==='string'?new TextEncoder().encode(value):value);return this;},
    digest(encoding:string) {if(encoding!=='hex')throw new Error('Unsupported encoding');return bytesToHex(state.digest());}
  };
}
