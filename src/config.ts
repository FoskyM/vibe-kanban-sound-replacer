// 配置管理模块 / Configuration management module

import { Config, SoundConfig } from './types';
import { SOUND_FILES } from './constants';

/**
 * 创建默认音效配置 / Create default sound config
 */
function createDefaultSoundConfig(): SoundConfig {
  return {
    mode: 'single',
    sources: [],
    sequenceIndex: 0
  };
}

/**
 * 创建默认配置 / Create default configuration
 */
export function createDefaultConfig(): Config {
  const config: Config = {
    enabled: true,
    sounds: {}
  };

  SOUND_FILES.forEach(sound => {
    if (sound === 'COW_MOOING') {
      // COW_MOOING 预设配置 / COW_MOOING preset config
      config.sounds[sound] = {
        mode: 'single',
        sources: [
          {
            url: 'https://github.com/FoskyM/vibe-kanban-sound-replacer/raw/main/source/ciallo.mp3',
            weight: 1,
            name: 'Ciallo～(∠・ω< )⌒☆'
          }
        ],
        sequenceIndex: 0
      };
    } else {
      config.sounds[sound] = createDefaultSoundConfig();
    }
  });

  return config;
}

/**
 * 获取配置 / Get configuration
 */
export function getConfig(): Config {
  try {
    const config = GM_getValue<Config>('config', createDefaultConfig());

    // 确保所有音效都有配置 / Ensure all sounds have config
    SOUND_FILES.forEach(sound => {
      if (!config.sounds[sound]) {
        config.sounds[sound] = createDefaultSoundConfig();
      }
    });

    return config;
  } catch (e) {
    console.error('[VKSR] 获取配置失败 / Failed to get config:', e);
    return createDefaultConfig();
  }
}

/**
 * 保存配置 / Save configuration
 */
export function saveConfig(config: Config): void {
  try {
    GM_setValue('config', config);
  } catch (e) {
    console.error('[VKSR] 保存配置失败 / Failed to save config:', e);
  }
}

/**
 * 导出配置为 JSON / Export config as JSON
 */
export function exportConfig(): string {
  return JSON.stringify(getConfig(), null, 2);
}

/**
 * 导入配置 / Import configuration
 */
export function importConfig(jsonStr: string): boolean {
  try {
    const config = JSON.parse(jsonStr) as Config;
    saveConfig(config);
    return true;
  } catch (e) {
    console.error('[VKSR] 导入配置失败 / Failed to import config:', e);
    return false;
  }
}
