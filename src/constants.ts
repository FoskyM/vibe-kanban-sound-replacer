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
 * 音效文件名映射（用于导出脚本）/ Sound filename mapping (for export script)
 * 映射到 Vibe Kanban 使用的实际文件名 / Maps to actual filenames used by Vibe Kanban
 */
export const SOUND_FILENAMES: Record<SoundFile, string> = {
  'ABSTRACT_SOUND1': 'sound-abstract-sound1.wav',
  'ABSTRACT_SOUND2': 'sound-abstract-sound2.wav',
  'ABSTRACT_SOUND3': 'sound-abstract-sound3.wav',
  'ABSTRACT_SOUND4': 'sound-abstract-sound4.wav',
  'COW_MOOING': 'sound-cow-mooing.wav',
  'PHONE_VIBRATION': 'sound-phone-vibration.wav',
  'ROOSTER': 'sound-rooster.wav'
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
