// WAV 音频转换工具 / WAV audio conversion utilities
// 使用 Web Audio API 将各种音频格式转换为 WAV

/**
 * WAV 文件头信息 / WAV file header info
 */
interface WavHeader {
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
}

/**
 * 创建 WAV 文件头 / Create WAV file header
 */
function createWavHeader(dataLength: number, header: WavHeader): ArrayBuffer {
  const { sampleRate, numChannels, bitsPerSample } = header;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true); // file size - 8
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // sub-chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  return buffer;
}

/**
 * 写入字符串到 DataView / Write string to DataView
 */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * 将 AudioBuffer 转换为 WAV 格式的 Uint8Array / Convert AudioBuffer to WAV format Uint8Array
 */
function audioBufferToWav(audioBuffer: AudioBuffer): Uint8Array {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bitsPerSample = 16;
  const length = audioBuffer.length;

  // 交错通道数据 / Interleave channel data
  const interleaved = new Int16Array(length * numChannels);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // 将 float32 (-1 to 1) 转换为 int16 / Convert float32 to int16
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      interleaved[i * numChannels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
  }

  // 创建 WAV 文件 / Create WAV file
  const dataLength = interleaved.length * 2; // 16-bit = 2 bytes per sample
  const header = createWavHeader(dataLength, { sampleRate, numChannels, bitsPerSample });

  // 合并头部和数据 / Combine header and data
  const wav = new Uint8Array(44 + dataLength);
  wav.set(new Uint8Array(header), 0);
  wav.set(new Uint8Array(interleaved.buffer), 44);

  return wav;
}

/**
 * 检查是否为有效的 WAV 文件 / Check if valid WAV file
 */
function isValidWav(data: Uint8Array): boolean {
  if (data.length < 44) return false;

  // 检查 RIFF 头 / Check RIFF header
  const riff = String.fromCharCode(data[0], data[1], data[2], data[3]);
  const wave = String.fromCharCode(data[8], data[9], data[10], data[11]);

  return riff === 'RIFF' && wave === 'WAVE';
}

/**
 * 将音频数据转换为 WAV 格式 / Convert audio data to WAV format
 * @param data 原始音频数据 / Original audio data
 * @returns WAV 格式的音频数据 / WAV format audio data
 */
export async function convertToWav(data: Uint8Array): Promise<Uint8Array> {
  // 如果已经是有效的 WAV，直接返回 / If already valid WAV, return as-is
  if (isValidWav(data)) {
    return data;
  }

  // 使用 Web Audio API 解码 / Decode using Web Audio API
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

  try {
    const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const wavData = audioBufferToWav(audioBuffer);
    return wavData;
  } finally {
    await audioContext.close();
  }
}
