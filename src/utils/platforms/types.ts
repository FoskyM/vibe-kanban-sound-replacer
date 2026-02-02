// 平台脚本生成器类型定义 / Platform script generator type definitions

import { PlayMode } from '../../types';

/**
 * 支持的平台 / Supported platforms
 */
export type Platform = 'windows' | 'macos' | 'linux';

/**
 * 平台显示名称 / Platform display names
 */
export const PLATFORM_NAMES: Record<Platform, string> = {
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux'
};

/**
 * 音频文件信息 / Audio file info
 */
export interface AudioFileInfo {
  targetFilename: string;  // 目标文件名 (如 sound-cow-mooing.wav) / Target filename
  sourceFiles: string[];   // 源文件列表 / Source file list
  weights: number[];       // 权重列表 / Weight list
  mode: PlayMode;          // 播放模式 / Play mode
}

/**
 * 平台脚本生成器接口 / Platform script generator interface
 */
export interface PlatformScriptGenerator {
  /** 平台标识 / Platform identifier */
  platform: Platform;

  /** 生成的脚本文件名 / Generated script filename */
  scriptFilename: string;

  /** 生成脚本内容 / Generate script content */
  generateScript(audioInfos: AudioFileInfo[]): string;

  /** 生成 README 内容 / Generate README content */
  generateReadme(): string;
}
