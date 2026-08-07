const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeSolidPng(width, height, r, g, b, filename) {
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  
  const ihdrChunkHeader = Buffer.from('IHDR');
  const ihdrChunk = Buffer.concat([ihdrChunkHeader, ihdrData]);
  const ihdrLength = Buffer.alloc(4);
  ihdrLength.writeUInt32BE(ihdrData.length, 0);
  const ihdrCrc = Buffer.alloc(4);
  ihdrCrc.writeUInt32BE(crc32(ihdrChunk), 0);
  
  // IDAT chunk (pixel data)
  // Each row starts with a filter byte (0)
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData.writeUInt8(0, rowOffset); // filter type 0
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      rawData.writeUInt8(r, pixelOffset);
      rawData.writeUInt8(g, pixelOffset + 1);
      rawData.writeUInt8(b, pixelOffset + 2);
    }
  }
  
  const compressedData = zlib.deflateSync(rawData);
  const idatChunkHeader = Buffer.from('IDAT');
  const idatChunk = Buffer.concat([idatChunkHeader, compressedData]);
  const idatLength = Buffer.alloc(4);
  idatLength.writeUInt32BE(compressedData.length, 0);
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(idatChunk), 0);
  
  // IEND chunk
  const iendLength = Buffer.alloc(4); // 0
  const iendChunk = Buffer.from('IEND');
  const iendCrc = Buffer.alloc(4);
  iendCrc.writeUInt32BE(crc32(iendChunk), 0);
  
  // Combine all
  const fileData = Buffer.concat([
    pngSig,
    ihdrLength, ihdrChunk, ihdrCrc,
    idatLength, idatChunk, idatCrc,
    iendLength, iendChunk, iendCrc
  ]);
  
  fs.writeFileSync(filename, fileData);
  console.log(`Successfully generated ${filename} (${width}x${height})`);
}

const targetDir = process.argv[2] || '.';
// Indigo color: RGB (79, 70, 229)
makeSolidPng(192, 192, 79, 70, 229, path.join(targetDir, 'logo192.png'));
makeSolidPng(512, 512, 79, 70, 229, path.join(targetDir, 'logo512.png'));
makeSolidPng(64, 64, 79, 70, 229, path.join(targetDir, 'favicon.ico'));
