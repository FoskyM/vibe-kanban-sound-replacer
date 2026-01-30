// 音频劫持模块 / Audio hijacking module

import { getConfig, saveConfig } from './config';
import { SOUND_FILES } from './constants';
import { SoundConfig } from './types';

/**
 * 从 URL 中提取音效名称 / Extract sound name from URL
 */
export function extractSoundName(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  // 匹配 /api/sounds/{SOUND_FILE} 格式
  const match = url.match(/\/api\/sounds\/([A-Z0-9_]+)/i);
  if (match && SOUND_FILES.includes(match[1].toUpperCase() as any)) {
    return match[1].toUpperCase();
  }
  return null;
}

/**
 * 根据配置选择音频源 / Select audio source based on config
 */
export function selectAudioSource(soundConfig: SoundConfig, soundName: string): string | null {
  if (!soundConfig || !soundConfig.sources || soundConfig.sources.length === 0) {
    return null;
  }

  const sources = soundConfig.sources;
  const mode = soundConfig.mode || 'single';

  switch (mode) {
    case 'single':
      // 单一模式：始终返回第一个 / Single mode: always return the first one
      return sources[0].url;

    case 'random': {
      // 随机模式：随机选择 / Random mode: randomly select
      const randomIndex = Math.floor(Math.random() * sources.length);
      return sources[randomIndex].url;
    }

    case 'sequence': {
      // 轮询模式：按顺序循环 / Sequence mode: cycle in order
      const seqIndex = soundConfig.sequenceIndex || 0;
      const selectedUrl = sources[seqIndex % sources.length].url;
      // 更新索引 / Update index
      soundConfig.sequenceIndex = (seqIndex + 1) % sources.length;
      // 保存更新后的配置 / Save updated config
      const config = getConfig();
      config.sounds[soundName] = soundConfig;
      saveConfig(config);
      return selectedUrl;
    }

    case 'weighted': {
      // 权重模式：根据权重随机选择 / Weighted mode: randomly select based on weight
      const totalWeight = sources.reduce((sum, s) => sum + (s.weight || 1), 0);
      let random = Math.random() * totalWeight;
      for (const source of sources) {
        random -= (source.weight || 1);
        if (random <= 0) {
          return source.url;
        }
      }
      return sources[0].url;
    }

    default:
      return sources[0].url;
  }
}

/**
 * 劫持 window.Audio / Hijack window.Audio
 * 每次播放时实时读取配置，无需刷新页面 / Read config in real-time on each play, no refresh needed
 */
export function hijackAudio(): void {
  const OriginalAudio = unsafeWindow.Audio;

  // 创建代理 Audio 构造函数 / Create proxy Audio constructor
  const ProxyAudio = function(this: HTMLAudioElement, src?: string) {
    // 每次播放时重新获取配置 / Get config on each play
    const config = getConfig();

    if (!config.enabled) {
      return new OriginalAudio(src);
    }

    if (src) {
      const soundName = extractSoundName(src);

      if (soundName) {
        const soundConfig = config.sounds[soundName];
        const replacementUrl = selectAudioSource(soundConfig, soundName);

        if (replacementUrl) {
          console.log(`[VKSR] 替换音效 / Replacing: ${soundName}`);
          return new OriginalAudio(replacementUrl);
        }
      }
    }

    // 未匹配或无替换配置，使用原始 URL / No match or no replacement, use original URL
    return new OriginalAudio(src);
  } as unknown as typeof Audio;

  // 复制原型和静态属性 / Copy prototype and static properties
  ProxyAudio.prototype = OriginalAudio.prototype;
  Object.setPrototypeOf(ProxyAudio, OriginalAudio);

  // 替换全局 Audio / Replace global Audio
  unsafeWindow.Audio = ProxyAudio;

  console.log('[VKSR] Audio 劫持已启用 / Audio hijacking enabled');
}
