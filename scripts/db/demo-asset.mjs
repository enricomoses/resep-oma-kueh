import { deflateSync } from 'node:zlib';

// Code-generated technical placeholder, not a photograph or a business asset.
export function demoPng() {
  const size = 256;
  const rows = Buffer.alloc((size * 4 + 1) * size);
  const letters = {
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
    M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
    O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  };
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const letter = Math.floor((x - 32) / 48);
      const col = Math.floor(((x - 32) % 48) / 8);
      const line = Math.floor((y - 100) / 8);
      const ink =
        letter >= 0 &&
        letter < 4 &&
        col >= 0 &&
        col < 5 &&
        line >= 0 &&
        line < 7 &&
        letters['DEMO'[letter]][line][col] === '1';
      const offset = y * (size * 4 + 1) + 1 + x * 4;
      rows[offset] = rows[offset + 1] = rows[offset + 2] = ink ? 55 : 240;
      rows[offset + 3] = 255;
    }
  const crc = (buf) => {
    let c = 0xffffffff;
    for (const b of buf) {
      c ^= b;
      for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type, data) => {
    const name = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(Buffer.concat([name, data])));
    return Buffer.concat([length, name, data, sum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
export const demoAssetPath =
  'approved/f0400000-0000-4000-8000-000000000990.png';
