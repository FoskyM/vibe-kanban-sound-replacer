// 平台脚本生成器索引 / Platform script generators index

export * from './types';
export { windowsGenerator } from './windows';

// 未来添加其他平台 / Future platforms will be added here:
// export { macosGenerator } from './macos';
// export { linuxGenerator } from './linux';

import { Platform, PlatformScriptGenerator } from './types';
import { windowsGenerator } from './windows';

/**
 * 获取平台脚本生成器 / Get platform script generator
 */
export function getGenerator(platform: Platform): PlatformScriptGenerator {
  switch (platform) {
    case 'windows':
      return windowsGenerator;
    case 'macos':
    case 'linux':
      throw new Error(`Platform "${platform}" is not yet supported. Coming soon!`);
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

/**
 * 获取所有可用的平台 / Get all available platforms
 */
export function getAvailablePlatforms(): Platform[] {
  return ['windows'];
  // 未来: return ['windows', 'macos', 'linux'];
}
