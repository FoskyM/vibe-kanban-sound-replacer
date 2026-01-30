// 类型定义 / Type definitions

/**
 * 音源配置 / Audio source configuration
 */
export interface AudioSource {
  url: string;           // 音频 URL（在线地址或 base64）/ Audio URL (online or base64)
  weight: number;        // 权重（用于权重模式）/ Weight (for weighted mode)
  name?: string;         // 音源名称（用于显示）/ Source name (for display)
}

/**
 * 播放模式 / Play mode
 */
export type PlayMode = 'single' | 'random' | 'sequence' | 'weighted';

/**
 * 单个音效配置 / Single sound configuration
 */
export interface SoundConfig {
  mode: PlayMode;        // 播放模式 / Play mode
  sources: AudioSource[]; // 音源列表 / Source list
  sequenceIndex: number; // 轮询索引 / Sequence index
}

/**
 * 全局配置 / Global configuration
 */
export interface Config {
  enabled: boolean;      // 是否启用 / Enabled
  sounds: Record<string, SoundConfig>; // 音效配置映射 / Sound config map
}

/**
 * GM API 类型声明 / GM API type declarations
 */
declare global {
  function GM_getValue<T>(key: string, defaultValue: T): T;
  function GM_setValue(key: string, value: unknown): void;
  function GM_registerMenuCommand(caption: string, onClick: () => void): void;
  const unsafeWindow: Window & typeof globalThis;
}
