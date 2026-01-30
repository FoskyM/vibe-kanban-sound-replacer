// 常量定义 / Constants

/**
 * 支持的音效文件列表 / Supported sound files
 */
export const SOUND_FILES = [
  'ABSTRACT_SOUND1',
  'ABSTRACT_SOUND2',
  'ABSTRACT_SOUND3',
  'ABSTRACT_SOUND4',
  'COW_MOOING',
  'PHONE_VIBRATION',
  'ROOSTER'
] as const;

/**
 * 音效文件类型 / Sound file type
 */
export type SoundFile = typeof SOUND_FILES[number];

/**
 * 音效显示名称映射 / Sound display name mapping
 */
export const SOUND_DISPLAY_NAMES: Record<SoundFile, string> = {
  'ABSTRACT_SOUND1': 'Abstract 1',
  'ABSTRACT_SOUND2': 'Abstract 2',
  'ABSTRACT_SOUND3': 'Abstract 3',
  'ABSTRACT_SOUND4': 'Abstract 4',
  'COW_MOOING': 'Cow',
  'PHONE_VIBRATION': 'Vibration',
  'ROOSTER': 'Rooster'
};

/**
 * 播放模式显示名称 / Play mode display names
 */
export const MODE_DISPLAY_NAMES = {
  'single': '单一 Single',
  'random': '随机 Random',
  'sequence': '轮询 Sequence',
  'weighted': '权重 Weighted'
} as const;
