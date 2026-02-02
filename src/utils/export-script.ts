// 导出脚本包工具 / Export script package utilities

import { Config } from '../types';
import { SOUND_FILES, SOUND_FILENAMES, SoundFile } from '../constants';
import { createZip, ZipEntry } from './zip';
import { convertToWav } from './wav-converter';
import { Platform, AudioFileInfo, getGenerator } from './platforms';

/**
 * 从 Base64 Data URL 提取二进制数据 / Extract binary data from Base64 Data URL
 */
function base64ToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * 从 URL 获取音频数据 / Fetch audio data from URL
 */
async function fetchAudioData(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * 收集的文件信息 / Collected file info
 */
interface CollectedFileInfo {
  sources: string[];
  weights: number[];
  firstFileData: Uint8Array | null;
}

/**
 * 收集音频文件 / Collect audio files
 */
async function collectAudioFiles(
  config: Config
): Promise<{ zipEntries: ZipEntry[]; collectedFiles: Map<string, CollectedFileInfo> }> {
  const zipEntries: ZipEntry[] = [];
  const collectedFiles = new Map<string, CollectedFileInfo>();

  for (const soundName of SOUND_FILES) {
    const soundConfig = config.sounds[soundName];
    if (!soundConfig || soundConfig.sources.length === 0) continue;

    const targetFilename = SOUND_FILENAMES[soundName as SoundFile];
    const baseName = targetFilename.replace(/\.wav$/, '');
    const sources: string[] = [];
    const weights: number[] = [];
    let firstFileData: Uint8Array | null = null;

    for (let i = 0; i < soundConfig.sources.length; i++) {
      const source = soundConfig.sources[i];
      if (!source.url) continue;

      try {
        let data: Uint8Array;

        if (source.url.startsWith('data:')) {
          data = base64ToUint8Array(source.url);
        } else {
          data = await fetchAudioData(source.url);
        }

        // 转换为 WAV 格式 / Convert to WAV format
        const wavData = await convertToWav(data);

        // 源文件命名: baseName_index.wav
        const sourceFilename = `${baseName}_${i}.wav`;

        sources.push(sourceFilename);
        weights.push(source.weight || 1);

        if (i === 0) {
          firstFileData = wavData;
        }

        zipEntries.push({
          name: `sounds/${sourceFilename}`,
          data: wavData
        });
      } catch (error) {
        console.error(`Failed to process audio for ${soundName}[${i}]:`, error);
      }
    }

    if (sources.length > 0) {
      collectedFiles.set(soundName, { sources, weights, firstFileData });
    }
  }

  return { zipEntries, collectedFiles };
}

/**
 * 构建音频信息列表 / Build audio info list
 */
function buildAudioInfos(
  config: Config,
  collectedFiles: Map<string, CollectedFileInfo>
): AudioFileInfo[] {
  const audioInfos: AudioFileInfo[] = [];

  for (const soundName of SOUND_FILES) {
    const soundConfig = config.sounds[soundName];
    if (!soundConfig || soundConfig.sources.length === 0) continue;

    const targetFilename = SOUND_FILENAMES[soundName as SoundFile];
    const collected = collectedFiles.get(soundName);

    if (collected && collected.sources.length > 0) {
      audioInfos.push({
        targetFilename,
        sourceFiles: collected.sources,
        weights: collected.weights,
        mode: soundConfig.mode
      });
    }
  }

  return audioInfos;
}

/**
 * 导出脚本包 / Export script package
 * @param config 配置 / Configuration
 * @param platform 目标平台 / Target platform (default: windows)
 */
export async function exportScriptPackage(
  config: Config,
  platform: Platform = 'windows'
): Promise<void> {
  // 获取平台生成器 / Get platform generator
  const generator = getGenerator(platform);

  // 收集音频文件 / Collect audio files
  const { zipEntries, collectedFiles } = await collectAudioFiles(config);

  // 预置第一个音频文件为目标文件 / Pre-place first audio as target file
  for (const soundName of SOUND_FILES) {
    const collected = collectedFiles.get(soundName);
    if (!collected || !collected.firstFileData) continue;

    const targetFilename = SOUND_FILENAMES[soundName as SoundFile];
    zipEntries.push({
      name: targetFilename,
      data: collected.firstFileData
    });
  }

  // 构建音频信息并生成脚本 / Build audio info and generate script
  const audioInfos = buildAudioInfos(config, collectedFiles);
  const script = generator.generateScript(audioInfos);
  const encoder = new TextEncoder();

  zipEntries.push({
    name: generator.scriptFilename,
    data: encoder.encode(script)
  });

  // 添加 README / Add README
  const readme = generator.generateReadme();
  zipEntries.push({
    name: 'README.md',
    data: encoder.encode(readme)
  });

  // 生成 ZIP 并下载 / Generate ZIP and download
  const zipData = createZip(zipEntries);
  const blob = new Blob([zipData.buffer], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vksr-${platform}-script.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
