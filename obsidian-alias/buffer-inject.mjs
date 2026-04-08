import { Buffer } from 'buffer';
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}
export { Buffer };
