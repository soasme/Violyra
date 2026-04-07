import { describe, it, expect } from 'vitest';
import server from './server.cjs';

const { computeAcceptKey, encodeFrame, decodeFrame, OPCODES } = server;

describe('OPCODES', () => {
  it('defines expected opcode values', () => {
    expect(OPCODES.TEXT).toBe(0x01);
    expect(OPCODES.CLOSE).toBe(0x08);
    expect(OPCODES.PING).toBe(0x09);
    expect(OPCODES.PONG).toBe(0x0A);
  });
});

describe('computeAcceptKey', () => {
  it('produces the RFC 6455 accept key for a known client key', () => {
    // RFC 6455 §1.3 example
    const clientKey = 'dGhlIHNhbXBsZSBub25jZQ==';
    expect(computeAcceptKey(clientKey)).toBe('s3pPLMBiTxaQ9kYGzzhZRbK+xOo=');
  });

  it('returns a base64 string', () => {
    const result = computeAcceptKey('anykey');
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

describe('encodeFrame', () => {
  it('encodes a short text payload (< 126 bytes)', () => {
    const payload = Buffer.from('hello');
    const frame = encodeFrame(OPCODES.TEXT, payload);
    expect(frame[0]).toBe(0x80 | OPCODES.TEXT); // FIN + TEXT opcode
    expect(frame[1]).toBe(5);                    // payload length
    expect(frame.slice(2).toString()).toBe('hello');
  });

  it('encodes a medium payload (126–65535 bytes) with 2-byte extended length', () => {
    const payload = Buffer.alloc(200, 0x41); // 200 'A' bytes
    const frame = encodeFrame(OPCODES.TEXT, payload);
    expect(frame[1]).toBe(126);
    expect(frame.readUInt16BE(2)).toBe(200);
    expect(frame.slice(4)).toEqual(payload);
  });

  it('encodes a large payload (≥ 65536 bytes) with 8-byte extended length', () => {
    const payload = Buffer.alloc(70000, 0x42);
    const frame = encodeFrame(OPCODES.TEXT, payload);
    expect(frame[1]).toBe(127);
    expect(Number(frame.readBigUInt64BE(2))).toBe(70000);
    expect(frame.slice(10)).toEqual(payload);
  });
});

describe('decodeFrame', () => {
  it('returns null for buffers shorter than 2 bytes', () => {
    expect(decodeFrame(Buffer.alloc(1))).toBeNull();
    expect(decodeFrame(Buffer.alloc(0))).toBeNull();
  });

  it('decodes a masked client frame', () => {
    const payload = Buffer.from('hi');
    const mask = Buffer.from([0x11, 0x22, 0x33, 0x44]);
    const masked = Buffer.alloc(payload.length);
    for (let i = 0; i < payload.length; i++) {
      masked[i] = payload[i] ^ mask[i % 4];
    }

    // Build: FIN+TEXT, MASKED+len, mask bytes, masked payload
    const frame = Buffer.concat([
      Buffer.from([0x81, 0x80 | payload.length]),
      mask,
      masked,
    ]);

    const result = decodeFrame(frame);
    expect(result).not.toBeNull();
    expect(result.opcode).toBe(OPCODES.TEXT);
    expect(result.payload.toString()).toBe('hi');
    expect(result.bytesConsumed).toBe(2 + 4 + payload.length);
  });

  it('throws when frame is not masked', () => {
    const frame = Buffer.from([0x81, 0x02, 0x68, 0x69]); // unmasked "hi"
    expect(() => decodeFrame(frame)).toThrow('Client frames must be masked');
  });

  it('returns null when buffer is too short for declared payload', () => {
    const mask = Buffer.from([0x01, 0x02, 0x03, 0x04]);
    // Claims payload length 10 but provides only 2 bytes of payload
    const frame = Buffer.concat([
      Buffer.from([0x81, 0x80 | 10]),
      mask,
      Buffer.alloc(2),
    ]);
    expect(decodeFrame(frame)).toBeNull();
  });
});
