// 简易 ZIP 实现 (无压缩，仅存储)
// Simple ZIP implementation (store only, no compression)

/**
 * ZIP 文件条目 / ZIP file entry
 */
export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/**
 * CRC32 查找表 / CRC32 lookup table
 */
const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

/**
 * 计算 CRC32 / Calculate CRC32
 */
function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = crc32Table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * 写入小端序 16 位整数 / Write little-endian 16-bit integer
 */
function writeUint16LE(value: number): Uint8Array {
  return new Uint8Array([value & 0xFF, (value >> 8) & 0xFF]);
}

/**
 * 写入小端序 32 位整数 / Write little-endian 32-bit integer
 */
function writeUint32LE(value: number): Uint8Array {
  return new Uint8Array([
    value & 0xFF,
    (value >> 8) & 0xFF,
    (value >> 16) & 0xFF,
    (value >> 24) & 0xFF
  ]);
}

/**
 * 合并多个 Uint8Array / Concatenate multiple Uint8Arrays
 */
function concatArrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * 创建 ZIP 文件 / Create ZIP file
 * 使用 STORE 方法（无压缩）/ Using STORE method (no compression)
 */
export function createZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  // DOS 时间戳 / DOS timestamp
  const now = new Date();
  const dosTime = ((now.getSeconds() >> 1) | (now.getMinutes() << 5) | (now.getHours() << 11)) & 0xFFFF;
  const dosDate = (now.getDate() | ((now.getMonth() + 1) << 5) | ((now.getFullYear() - 1980) << 9)) & 0xFFFF;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crcValue = crc32(entry.data);
    const size = entry.data.length;

    // Local file header
    const localHeader = concatArrays(
      new Uint8Array([0x50, 0x4B, 0x03, 0x04]), // 签名 / Signature
      writeUint16LE(20),                         // 版本 / Version needed
      writeUint16LE(0),                          // 标志 / Flags
      writeUint16LE(0),                          // 压缩方法 (0=STORE) / Compression method
      writeUint16LE(dosTime),                    // 修改时间 / Mod time
      writeUint16LE(dosDate),                    // 修改日期 / Mod date
      writeUint32LE(crcValue),                   // CRC32
      writeUint32LE(size),                       // 压缩大小 / Compressed size
      writeUint32LE(size),                       // 原始大小 / Uncompressed size
      writeUint16LE(nameBytes.length),           // 文件名长度 / Filename length
      writeUint16LE(0),                          // 额外字段长度 / Extra field length
      nameBytes,                                 // 文件名 / Filename
      entry.data                                 // 文件数据 / File data
    );

    // Central directory header
    const centralHeader = concatArrays(
      new Uint8Array([0x50, 0x4B, 0x01, 0x02]), // 签名 / Signature
      writeUint16LE(20),                         // 创建版本 / Version made by
      writeUint16LE(20),                         // 需要版本 / Version needed
      writeUint16LE(0),                          // 标志 / Flags
      writeUint16LE(0),                          // 压缩方法 / Compression method
      writeUint16LE(dosTime),                    // 修改时间 / Mod time
      writeUint16LE(dosDate),                    // 修改日期 / Mod date
      writeUint32LE(crcValue),                   // CRC32
      writeUint32LE(size),                       // 压缩大小 / Compressed size
      writeUint32LE(size),                       // 原始大小 / Uncompressed size
      writeUint16LE(nameBytes.length),           // 文件名长度 / Filename length
      writeUint16LE(0),                          // 额外字段长度 / Extra field length
      writeUint16LE(0),                          // 注释长度 / Comment length
      writeUint16LE(0),                          // 磁盘号 / Disk number
      writeUint16LE(0),                          // 内部属性 / Internal attributes
      writeUint32LE(0),                          // 外部属性 / External attributes
      writeUint32LE(offset),                     // 本地头偏移 / Local header offset
      nameBytes                                  // 文件名 / Filename
    );

    localHeaders.push(localHeader);
    centralHeaders.push(centralHeader);
    offset += localHeader.length;
  }

  const centralDirOffset = offset;
  const centralDirSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);

  // End of central directory
  const endOfCentralDir = concatArrays(
    new Uint8Array([0x50, 0x4B, 0x05, 0x06]), // 签名 / Signature
    writeUint16LE(0),                          // 磁盘号 / Disk number
    writeUint16LE(0),                          // 中央目录磁盘号 / Central dir disk
    writeUint16LE(entries.length),             // 本磁盘条目数 / Entries on disk
    writeUint16LE(entries.length),             // 总条目数 / Total entries
    writeUint32LE(centralDirSize),             // 中央目录大小 / Central dir size
    writeUint32LE(centralDirOffset),           // 中央目录偏移 / Central dir offset
    writeUint16LE(0)                           // 注释长度 / Comment length
  );

  return concatArrays(
    ...localHeaders,
    ...centralHeaders,
    endOfCentralDir
  );
}
