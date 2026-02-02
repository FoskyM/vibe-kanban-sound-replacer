// ==UserScript==
// @name        Vibe Kanban Sound Replacer
// @description 替换 vibe-kanban 的音效 / Replace sound effects in vibe-kanban
// @namespace   https://github.com/FoskyM/vibe-kanban-sound-replacer
// @match       *://*/*
// @run-at      document-start
// @license     MIT
// @version     1.1.0
// @author      FoskyM <i@fosky.top>
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       unsafeWindow
// ==/UserScript==
(function () {
    'use strict';

    // 常量定义 / Constants
    /**
     * 支持的音效文件列表 / Supported sound files
     */
    const SOUND_FILES = [
        'ABSTRACT_SOUND1',
        'ABSTRACT_SOUND2',
        'ABSTRACT_SOUND3',
        'ABSTRACT_SOUND4',
        'COW_MOOING',
        'PHONE_VIBRATION',
        'ROOSTER'
    ];
    /**
     * 音效显示名称映射 / Sound display name mapping
     */
    const SOUND_DISPLAY_NAMES = {
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
    const SOUND_FILENAMES = {
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
    const MODE_DISPLAY_NAMES = {
        'single': '单一 Single',
        'random': '随机 Random',
        'sequence': '轮询 Sequence',
        'weighted': '权重 Weighted'
    };

    // 配置管理模块 / Configuration management module
    /**
     * 创建默认音效配置 / Create default sound config
     */
    function createDefaultSoundConfig() {
        return {
            mode: 'single',
            sources: [],
            sequenceIndex: 0
        };
    }
    /**
     * 创建默认配置 / Create default configuration
     */
    function createDefaultConfig() {
        const config = {
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
            }
            else {
                config.sounds[sound] = createDefaultSoundConfig();
            }
        });
        return config;
    }
    /**
     * 获取配置 / Get configuration
     */
    function getConfig() {
        try {
            const config = GM_getValue('config', createDefaultConfig());
            // 确保所有音效都有配置 / Ensure all sounds have config
            SOUND_FILES.forEach(sound => {
                if (!config.sounds[sound]) {
                    config.sounds[sound] = createDefaultSoundConfig();
                }
            });
            return config;
        }
        catch (e) {
            console.error('[VKSR] 获取配置失败 / Failed to get config:', e);
            return createDefaultConfig();
        }
    }
    /**
     * 保存配置 / Save configuration
     */
    function saveConfig(config) {
        try {
            GM_setValue('config', config);
        }
        catch (e) {
            console.error('[VKSR] 保存配置失败 / Failed to save config:', e);
        }
    }

    // 音频劫持模块 / Audio hijacking module
    /**
     * 从 URL 中提取音效名称 / Extract sound name from URL
     */
    function extractSoundName(url) {
        if (!url || typeof url !== 'string')
            return null;
        // 匹配 /api/sounds/{SOUND_FILE} 格式
        const match = url.match(/\/api\/sounds\/([A-Z0-9_]+)/i);
        if (match && SOUND_FILES.includes(match[1].toUpperCase())) {
            return match[1].toUpperCase();
        }
        return null;
    }
    /**
     * 根据配置选择音频源 / Select audio source based on config
     */
    function selectAudioSource(soundConfig, soundName) {
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
    function hijackAudio() {
        const OriginalAudio = unsafeWindow.Audio;
        // 创建代理 Audio 构造函数 / Create proxy Audio constructor
        const ProxyAudio = function (src) {
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
        };
        // 复制原型和静态属性 / Copy prototype and static properties
        ProxyAudio.prototype = OriginalAudio.prototype;
        Object.setPrototypeOf(ProxyAudio, OriginalAudio);
        // 替换全局 Audio / Replace global Audio
        unsafeWindow.Audio = ProxyAudio;
        console.log('[VKSR] Audio 劫持已启用 / Audio hijacking enabled');
    }

    // 页面检测模块 / Page detection module
    /**
     * 检测当前页面是否为 vibe-kanban / Detect if current page is vibe-kanban
     */
    function isVibeKanban() {
        // 检查标题 / Check title
        if (document.title && document.title.toLowerCase().includes('vibe-kanban')) {
            return true;
        }
        // 检查页面中的脚本 / Check scripts in page
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        for (const script of scripts) {
            const src = script.src;
            if (src && (src.includes('vibe-kanban') || src.includes('/api/sounds/'))) {
                return true;
            }
        }
        // 检查页面内容中是否有 vibe-kanban 相关标识 / Check page content for vibe-kanban identifiers
        const html = document.documentElement.innerHTML;
        if (html.includes('vibe-kanban') || html.includes('/api/sounds/')) {
            return true;
        }
        return false;
    }
    /**
     * 检查是否在设置页面 / Check if on settings page
     */
    function isSettingsPage() {
        return window.location.pathname === '/settings/general';
    }
    /**
     * 检查是否存在音效选择按钮 / Check if sound file button exists
     */
    function hasSoundFileButton() {
        return !!document.querySelector('button#sound-file');
    }

    // UI 样式模块 / UI styles module
    /**
     * 基础样式 / Base styles
     */
    const baseStyles = `
  /* CSS 变量定义 / CSS Variables */
  :root {
    /* 浅色主题（默认）/ Light theme (default) */
    --vksr-bg-primary: #ffffff;
    --vksr-bg-secondary: #f5f5f5;
    --vksr-bg-tertiary: #ebebeb;
    --vksr-bg-hover: #e0e0e0;

    --vksr-text-primary: #1a1a1a;
    --vksr-text-secondary: #666666;
    --vksr-text-muted: #999999;

    --vksr-border: #d4d4d4;
    --vksr-border-light: #e5e5e5;

    --vksr-accent: #3b82f6;
    --vksr-accent-hover: #2563eb;

    --vksr-danger: #ef4444;
    --vksr-danger-hover: #dc2626;

    --vksr-overlay-bg: rgba(0, 0, 0, 0.4);
  }

  /* 深色主题 / Dark theme */
  html.dark {
    --vksr-bg-primary: #1a1a1a;
    --vksr-bg-secondary: #252525;
    --vksr-bg-tertiary: #2d2d2d;
    --vksr-bg-hover: #333333;

    --vksr-text-primary: #e5e5e5;
    --vksr-text-secondary: #a0a0a0;
    --vksr-text-muted: #666666;

    --vksr-border: #3a3a3a;
    --vksr-border-light: #444444;

    --vksr-overlay-bg: rgba(0, 0, 0, 0.7);
  }

  /* 遮罩层 / Overlay */
  .vksr-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--vksr-overlay-bg);
    backdrop-filter: blur(4px);
    z-index: 999998;
  }

  /* 面板 / Panel */
  .vksr-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 560px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
    background: var(--vksr-bg-primary);
    border: 1px solid var(--vksr-border);
    z-index: 999999;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--vksr-text-primary);
    display: flex;
    flex-direction: column;
  }

  /* 头部 / Header */
  .vksr-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--vksr-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  .vksr-title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--vksr-text-primary);
    letter-spacing: -0.01em;
  }

  .vksr-close-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--vksr-text-secondary);
    padding: 4px 8px;
    line-height: 1;
    transition: color 0.15s;
  }

  .vksr-close-btn:hover {
    color: var(--vksr-text-primary);
  }

  /* 内容区 / Content */
  .vksr-content {
    padding: 16px 20px;
    overflow-y: auto;
    flex: 1;
  }

  /* 底部 / Footer */
  .vksr-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--vksr-border);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    flex-shrink: 0;
  }

  /* 开关行 / Toggle row */
  .vksr-toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--vksr-border);
  }

  .vksr-toggle-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--vksr-text-primary);
  }

  /* 自定义开关 / Custom toggle switch */
  .vksr-switch {
    position: relative;
    width: 36px;
    height: 20px;
    background: var(--vksr-bg-tertiary);
    border: 1px solid var(--vksr-border);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }

  .vksr-switch.active {
    background: var(--vksr-accent);
    border-color: var(--vksr-accent);
  }

  .vksr-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: var(--vksr-text-primary);
    transition: transform 0.2s;
  }

  .vksr-switch.active::after {
    transform: translateX(16px);
    background: #ffffff;
  }

  /* 音效卡片 / Sound card */
  .vksr-sound-card {
    margin-bottom: 12px;
    background: var(--vksr-bg-secondary);
    border: 1px solid var(--vksr-border);
  }

  .vksr-sound-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    border-bottom: 1px solid var(--vksr-border);
    cursor: pointer;
    transition: background 0.15s;
  }

  .vksr-sound-header:hover {
    background: var(--vksr-bg-hover);
  }

  .vksr-sound-name {
    font-size: 12px;
    font-weight: 600;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    color: var(--vksr-text-primary);
  }

  .vksr-sound-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .vksr-sound-count {
    font-size: 11px;
    color: var(--vksr-text-muted);
  }

  .vksr-expand-icon {
    font-size: 10px;
    color: var(--vksr-text-muted);
    transition: transform 0.2s;
  }

  .vksr-expand-icon.expanded {
    transform: rotate(180deg);
  }

  .vksr-sound-body {
    padding: 12px 14px;
    display: none;
  }

  .vksr-sound-body.expanded {
    display: block;
  }

  /* 模式选择 / Mode select */
  .vksr-mode-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .vksr-mode-label {
    font-size: 11px;
    color: var(--vksr-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .vksr-select {
    flex: 1;
    padding: 6px 10px;
    background: var(--vksr-bg-tertiary);
    border: 1px solid var(--vksr-border);
    color: var(--vksr-text-primary);
    font-size: 12px;
    cursor: pointer;
    outline: none;
  }

  .vksr-select:focus {
    border-color: var(--vksr-accent);
  }

  /* 音源列表 / Source list */
  .vksr-source-item {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
    align-items: center;
  }

  .vksr-source-name-input {
    flex: 1;
    min-width: 0;
    padding: 8px 10px;
    background: var(--vksr-bg-tertiary);
    border: 1px solid var(--vksr-border);
    color: var(--vksr-text-primary);
    font-size: 12px;
    outline: none;
  }

  .vksr-source-name-input:focus {
    border-color: var(--vksr-accent);
  }

  .vksr-source-name-input::placeholder {
    color: var(--vksr-text-muted);
  }

  .vksr-source-btn {
    padding: 8px 12px;
    background: var(--vksr-bg-tertiary);
    border: 1px solid var(--vksr-border);
    color: var(--vksr-text-primary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .vksr-source-btn:hover {
    border-color: var(--vksr-accent);
    color: var(--vksr-accent);
  }

  .vksr-source-btn.placeholder {
    color: var(--vksr-text-muted);
  }

  .vksr-source-name {
    flex: 1;
    min-width: 0;
    padding: 8px 10px;
    background: var(--vksr-bg-tertiary);
    border: 1px solid var(--vksr-border);
    color: var(--vksr-text-primary);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .vksr-source-name:hover {
    border-color: var(--vksr-accent);
  }

  .vksr-source-name.placeholder {
    color: var(--vksr-text-muted);
  }

  .vksr-weight-input {
    width: 50px;
    padding: 8px 6px;
    background: var(--vksr-bg-tertiary);
    border: 1px solid var(--vksr-border);
    color: var(--vksr-text-primary);
    font-size: 12px;
    text-align: center;
    outline: none;
  }

  .vksr-weight-input:focus {
    border-color: var(--vksr-accent);
  }

  .vksr-icon-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    background: var(--vksr-bg-tertiary);
    border: 1px solid var(--vksr-border);
    color: var(--vksr-text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .vksr-icon-btn:hover {
    background: var(--vksr-bg-hover);
    color: var(--vksr-text-primary);
  }

  .vksr-icon-btn.playing {
    background: var(--vksr-accent);
    border-color: var(--vksr-accent);
    color: white;
  }

  .vksr-icon-btn.danger {
    color: var(--vksr-danger);
  }

  .vksr-icon-btn.danger:hover {
    background: var(--vksr-danger);
    border-color: var(--vksr-danger);
    color: white;
  }

  /* 添加按钮 / Add button */
  .vksr-add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 8px;
    background: transparent;
    border: 1px dashed var(--vksr-border);
    color: var(--vksr-text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .vksr-add-btn:hover {
    border-color: var(--vksr-accent);
    color: var(--vksr-accent);
  }

  /* 底部按钮 / Footer buttons */
  .vksr-btn {
    padding: 8px 14px;
    background: var(--vksr-bg-tertiary);
    border: 1px solid var(--vksr-border);
    color: var(--vksr-text-primary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .vksr-btn:hover {
    background: var(--vksr-bg-hover);
  }

  .vksr-btn.primary {
    background: var(--vksr-accent);
    border-color: var(--vksr-accent);
    color: white;
  }

  .vksr-btn.primary:hover {
    background: var(--vksr-accent-hover);
  }

  .vksr-btn.danger {
    color: var(--vksr-danger);
  }

  .vksr-btn.danger:hover {
    background: var(--vksr-danger);
    border-color: var(--vksr-danger);
    color: white;
  }

  /* 入口按钮 / Entry button */
  .vksr-entry-btn {
    padding: 6px 12px;
    background: var(--vksr-bg-secondary);
    border: 1px solid var(--vksr-border);
    color: var(--vksr-text-primary);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    margin-left: 8px;
  }

  .vksr-entry-btn:hover {
    background: var(--vksr-bg-hover);
    border-color: var(--vksr-border-light);
  }

  /* 对话框 / Dialog */
  .vksr-dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--vksr-overlay-bg);
    backdrop-filter: blur(4px);
    z-index: 1000000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vksr-dialog {
    width: 360px;
    max-width: calc(100vw - 32px);
    background: var(--vksr-bg-primary);
    border: 1px solid var(--vksr-border);
    padding: 20px;
  }

  .vksr-dialog-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--vksr-text-primary);
    margin-bottom: 16px;
  }

  .vksr-dialog-hint {
    padding: 8px 10px;
    background: var(--vksr-bg-tertiary);
    border: 1px solid var(--vksr-border);
    color: var(--vksr-text-secondary);
    font-size: 11px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .vksr-dialog-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .vksr-dialog-btn {
    padding: 10px 16px;
    background: var(--vksr-bg-tertiary);
    border: 1px solid var(--vksr-border);
    color: var(--vksr-text-primary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
  }

  .vksr-dialog-btn:hover {
    background: var(--vksr-bg-hover);
  }

  .vksr-dialog-btn.primary {
    background: var(--vksr-accent);
    border-color: var(--vksr-accent);
    color: white;
  }

  .vksr-dialog-btn.primary:hover {
    background: var(--vksr-accent-hover);
  }

  .vksr-dialog-divider {
    text-align: center;
    font-size: 11px;
    color: var(--vksr-text-muted);
    padding: 4px 0;
  }

  .vksr-dialog-input {
    padding: 10px 12px;
    background: var(--vksr-bg-tertiary);
    border: 1px solid var(--vksr-border);
    color: var(--vksr-text-primary);
    font-size: 13px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
  }

  .vksr-dialog-input:focus {
    border-color: var(--vksr-accent);
  }

  .vksr-dialog-input::placeholder {
    color: var(--vksr-text-muted);
  }

  /* 移动端适配 / Mobile adaptation */
  @media (max-width: 640px) {
    .vksr-panel {
      width: 100%;
      max-width: 100%;
      max-height: 100%;
      top: 0;
      left: 0;
      transform: none;
      border: none;
    }

    .vksr-source-item {
      flex-wrap: wrap;
    }

    .vksr-source-name-input {
      width: 100%;
      flex: none;
    }

    .vksr-source-btn {
      flex: 1;
    }

    .vksr-source-name {
      width: 100%;
      flex: none;
    }

    .vksr-weight-input {
      width: 60px;
    }

    .vksr-entry-btn {
      padding: 8px 12px;
    }
  }
`;
    /**
     * 注入样式 / Inject styles
     */
    function injectStyles() {
        if (document.getElementById('vksr-styles'))
            return;
        const style = document.createElement('style');
        style.id = 'vksr-styles';
        style.textContent = baseStyles;
        document.head.appendChild(style);
    }

    // DOM 工具模块 / DOM utilities module
    /**
     * 创建元素 / Create element
     */
    function createElement(tag, className, attrs) {
        const el = document.createElement(tag);
        if (className)
            el.className = className;
        return el;
    }
    /**
     * 添加事件监听 / Add event listener
     */
    function on(el, event, handler) {
        el.addEventListener(event, handler);
    }
    /**
     * 移除元素 / Remove element
     */
    function remove(el) {
        el?.remove();
    }

    // 文件工具模块 / File utilities module
    /**
     * 将文件转换为 Base64 Data URL / Convert file to Base64 Data URL
     */
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    /**
     * 打开文件选择器 / Open file picker
     */
    function openFilePicker(accept = 'audio/*') {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.style.display = 'none';
            input.onchange = () => {
                const file = input.files?.[0] || null;
                input.remove();
                resolve(file);
            };
            input.oncancel = () => {
                input.remove();
                resolve(null);
            };
            document.body.appendChild(input);
            input.click();
        });
    }
    /**
     * 下载 JSON 文件 / Download JSON file
     */
    function downloadJson(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    /**
     * 读取 JSON 文件 / Read JSON file
     */
    function readJsonFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result);
                    resolve(data);
                }
                catch (e) {
                    reject(new Error('Invalid JSON format'));
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // 简易 ZIP 实现 (无压缩，仅存储)
    // Simple ZIP implementation (store only, no compression)
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
    function crc32(data) {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) {
            crc = crc32Table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }
    /**
     * 写入小端序 16 位整数 / Write little-endian 16-bit integer
     */
    function writeUint16LE(value) {
        return new Uint8Array([value & 0xFF, (value >> 8) & 0xFF]);
    }
    /**
     * 写入小端序 32 位整数 / Write little-endian 32-bit integer
     */
    function writeUint32LE(value) {
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
    function concatArrays(...arrays) {
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
    function createZip(entries) {
        const encoder = new TextEncoder();
        const localHeaders = [];
        const centralHeaders = [];
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
            const localHeader = concatArrays(new Uint8Array([0x50, 0x4B, 0x03, 0x04]), // 签名 / Signature
            writeUint16LE(20), // 版本 / Version needed
            writeUint16LE(0), // 标志 / Flags
            writeUint16LE(0), // 压缩方法 (0=STORE) / Compression method
            writeUint16LE(dosTime), // 修改时间 / Mod time
            writeUint16LE(dosDate), // 修改日期 / Mod date
            writeUint32LE(crcValue), // CRC32
            writeUint32LE(size), // 压缩大小 / Compressed size
            writeUint32LE(size), // 原始大小 / Uncompressed size
            writeUint16LE(nameBytes.length), // 文件名长度 / Filename length
            writeUint16LE(0), // 额外字段长度 / Extra field length
            nameBytes, // 文件名 / Filename
            entry.data // 文件数据 / File data
            );
            // Central directory header
            const centralHeader = concatArrays(new Uint8Array([0x50, 0x4B, 0x01, 0x02]), // 签名 / Signature
            writeUint16LE(20), // 创建版本 / Version made by
            writeUint16LE(20), // 需要版本 / Version needed
            writeUint16LE(0), // 标志 / Flags
            writeUint16LE(0), // 压缩方法 / Compression method
            writeUint16LE(dosTime), // 修改时间 / Mod time
            writeUint16LE(dosDate), // 修改日期 / Mod date
            writeUint32LE(crcValue), // CRC32
            writeUint32LE(size), // 压缩大小 / Compressed size
            writeUint32LE(size), // 原始大小 / Uncompressed size
            writeUint16LE(nameBytes.length), // 文件名长度 / Filename length
            writeUint16LE(0), // 额外字段长度 / Extra field length
            writeUint16LE(0), // 注释长度 / Comment length
            writeUint16LE(0), // 磁盘号 / Disk number
            writeUint16LE(0), // 内部属性 / Internal attributes
            writeUint32LE(0), // 外部属性 / External attributes
            writeUint32LE(offset), // 本地头偏移 / Local header offset
            nameBytes // 文件名 / Filename
            );
            localHeaders.push(localHeader);
            centralHeaders.push(centralHeader);
            offset += localHeader.length;
        }
        const centralDirOffset = offset;
        const centralDirSize = centralHeaders.reduce((sum, h) => sum + h.length, 0);
        // End of central directory
        const endOfCentralDir = concatArrays(new Uint8Array([0x50, 0x4B, 0x05, 0x06]), // 签名 / Signature
        writeUint16LE(0), // 磁盘号 / Disk number
        writeUint16LE(0), // 中央目录磁盘号 / Central dir disk
        writeUint16LE(entries.length), // 本磁盘条目数 / Entries on disk
        writeUint16LE(entries.length), // 总条目数 / Total entries
        writeUint32LE(centralDirSize), // 中央目录大小 / Central dir size
        writeUint32LE(centralDirOffset), // 中央目录偏移 / Central dir offset
        writeUint16LE(0) // 注释长度 / Comment length
        );
        return concatArrays(...localHeaders, ...centralHeaders, endOfCentralDir);
    }

    // WAV 音频转换工具 / WAV audio conversion utilities
    // 使用 Web Audio API 将各种音频格式转换为 WAV
    /**
     * 创建 WAV 文件头 / Create WAV file header
     */
    function createWavHeader(dataLength, header) {
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
    function writeString(view, offset, str) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }
    /**
     * 将 AudioBuffer 转换为 WAV 格式的 Uint8Array / Convert AudioBuffer to WAV format Uint8Array
     */
    function audioBufferToWav(audioBuffer) {
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
    function isValidWav(data) {
        if (data.length < 44)
            return false;
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
    async function convertToWav(data) {
        // 如果已经是有效的 WAV，直接返回 / If already valid WAV, return as-is
        if (isValidWav(data)) {
            return data;
        }
        // 使用 Web Audio API 解码 / Decode using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        try {
            const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const wavData = audioBufferToWav(audioBuffer);
            return wavData;
        }
        finally {
            await audioContext.close();
        }
    }

    // Windows 平台脚本生成器 / Windows platform script generator
    /**
     * Windows 平台脚本生成器 / Windows platform script generator
     */
    const windowsGenerator = {
        platform: 'windows',
        scriptFilename: 'toast-notification.ps1',
        generateScript(audioInfos) {
            // 生成配置对象 / Generate config object
            const configEntries = audioInfos.map(info => {
                const filesStr = info.sourceFiles.map(f => `"${f}"`).join(', ');
                const weightsStr = info.weights.join(', ');
                return `    "${info.targetFilename}" = @{
        Sources = @(${filesStr})
        Weights = @(${weightsStr})
        Mode = "${info.mode}"
    }`;
            }).join('\n');
            return `# Vibe Kanban Sound Replacer - Toast Notification Script (Windows)
# Generated by VKSR Plugin
# https://github.com/foskym/vibe-kanban-sound-replacer
#
# 工作原理 / How it works:
# 1. 脚本启动时扫描 sounds/ 目录下的音频源文件
# 2. 根据配置的模式选择一个音频文件
# 3. 将选中的音频复制为目标文件名 (如 sound-cow-mooing.wav)
# 4. Vibe Kanban 播放该文件时就会使用替换后的音频

param(
    [Parameter(Mandatory=$true)]
    [string]$Title,

    [Parameter(Mandatory=$true)]
    [string]$Message,

    [Parameter(Mandatory=$false)]
    [string]$AppName = "Vibe Kanban"
)

# ============================================
# Configuration
# ============================================
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SoundsDir = Join-Path $ScriptDir "sounds"
$StateFile = Join-Path $ScriptDir "vksr-state.json"

# Sound configurations (generated from plugin settings)
# 每个音效的配置：Sources=源文件列表, Weights=权重, Mode=播放模式
$SoundConfig = @{
${configEntries}
}

# ============================================
# Functions
# ============================================

function Get-State {
    if (Test-Path $StateFile) {
        try {
            $content = Get-Content $StateFile -Raw -ErrorAction Stop
            if ($content) {
                return $content | ConvertFrom-Json
            }
        } catch {}
    }
    return [PSCustomObject]@{}
}

function Save-State($state) {
    try {
        $state | ConvertTo-Json | Set-Content $StateFile -Encoding UTF8 -ErrorAction Stop
    } catch {}
}

function Select-SourceFile($targetName, $cfg) {
    $sources = $cfg.Sources
    $weights = $cfg.Weights
    $mode = $cfg.Mode

    if ($sources.Count -eq 0) { return $null }
    if ($sources.Count -eq 1) { return $sources[0] }

    switch ($mode) {
        "single" {
            return $sources[0]
        }
        "random" {
            return $sources | Get-Random
        }
        "sequence" {
            $state = Get-State
            $key = "seq_$targetName"
            $index = 0
            if ($state.PSObject.Properties.Name -contains $key) {
                $index = [int]$state.$key
            }
            $selected = $sources[$index % $sources.Count]
            $state | Add-Member -NotePropertyName $key -NotePropertyValue (($index + 1) % $sources.Count) -Force
            Save-State $state
            return $selected
        }
        "weighted" {
            $totalWeight = ($weights | Measure-Object -Sum).Sum
            if ($totalWeight -le 0) { return $sources[0] }
            $rand = Get-Random -Minimum 0 -Maximum $totalWeight
            $cumulative = 0
            for ($i = 0; $i -lt $sources.Count; $i++) {
                $cumulative += $weights[$i]
                if ($rand -lt $cumulative) {
                    return $sources[$i]
                }
            }
            return $sources[0]
        }
        default {
            return $sources[0]
        }
    }
}

# ============================================
# Main Logic - Replace Sound Files
# ============================================

foreach ($targetName in $SoundConfig.Keys) {
    $cfg = $SoundConfig[$targetName]
    $targetPath = Join-Path $ScriptDir $targetName

    # 选择源文件 / Select source file
    $selectedSource = Select-SourceFile $targetName $cfg
    if (-not $selectedSource) { continue }

    $sourcePath = Join-Path $SoundsDir $selectedSource
    if (-not (Test-Path $sourcePath)) { continue }

    # 复制文件替换目标 / Copy file to replace target
    try {
        Copy-Item -Path $sourcePath -Destination $targetPath -Force -ErrorAction Stop
    } catch {
        # 忽略复制错误 / Ignore copy errors
    }
}

# ============================================
# Show Toast Notification
# ============================================

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
$Template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$RawXml = [xml] $Template.GetXml()
($RawXml.toast.visual.binding.text|where {\$_.id -eq "1"}).AppendChild($RawXml.CreateTextNode($Title)) | Out-Null
($RawXml.toast.visual.binding.text|where {\$_.id -eq "2"}).AppendChild($RawXml.CreateTextNode($Message)) | Out-Null
$SerializedXml = New-Object Windows.Data.Xml.Dom.XmlDocument
$SerializedXml.LoadXml($RawXml.OuterXml)
$Toast = [Windows.UI.Notifications.ToastNotification]::new($SerializedXml)
$Toast.Tag = $AppName
$Toast.Group = $AppName
$Notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($AppName)
$Notifier.Show($Toast)
`;
        },
        generateReadme() {
            return `# Vibe Kanban Sound Replacer - Custom Notification Script

This package contains a customized toast notification script with your configured audio files.

**Platform: Windows**

## Installation

1. Extract this ZIP to a temporary location

2. Locate the Vibe Kanban utils directory:
   - Usually at: \`%LOCALAPPDATA%\\Programs\\vibe-kanban\\resources\\utils\\\`
   - Or check your Vibe Kanban installation directory under \`resources\\utils\\\`

3. **Backup** the original \`toast-notification.ps1\` (rename it to \`toast-notification.ps1.bak\`)

4. Copy all files from this package to the utils directory:
   - \`toast-notification.ps1\` (the new script)
   - \`sounds/\` folder (contains your audio source files)
   - \`sound-*.wav\` files (pre-placed audio files for immediate use)

## Directory Structure

After installation, your utils folder should look like:
\`\`\`
utils/
├── toast-notification.ps1      (the new script from this package)
├── toast-notification.ps1.bak  (your backup of the original)
├── sounds/                     (audio source files)
│   ├── sound-cow-mooing_0.wav
│   ├── sound-cow-mooing_1.wav
│   └── ...
├── sound-cow-mooing.wav        (pre-placed, will be replaced on each notification)
├── sound-rooster.wav           (pre-placed, will be replaced on each notification)
└── vksr-state.json             (auto-generated, stores sequence state)
\`\`\`

## How It Works

1. **First notification**: Uses the pre-placed audio files (e.g., \`sound-cow-mooing.wav\`)
2. **On each notification**: The script selects a new audio from \`sounds/\` based on your mode:
   - **Single**: Always uses the first audio file
   - **Random**: Randomly selects from the list
   - **Sequence**: Cycles through files in order
   - **Weighted**: Random selection weighted by your settings
3. The selected audio is copied to replace the target file for the **next** notification
4. This ensures smooth playback since Rust plays audio before the script runs

## Sound File Mapping

| Plugin Sound Name | Target File |
|-------------------|-------------|
${SOUND_FILES.map(name => `| ${name} | ${SOUND_FILENAMES[name]} |`).join('\n')}

## Troubleshooting

- **No sound change**: Check if files exist in the \`sounds/\` folder
- **Script error**: Ensure PowerShell execution policy allows scripts
  - Run: \`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser\`
- **Reset sequence**: Delete \`vksr-state.json\` to restart from the first file

## Notes

- Re-export from the plugin if you change your audio settings
- The script runs each time a notification is triggered
- All audio files are converted to WAV format for compatibility

---
Generated by VKSR Plugin
`;
        }
    };

    // 平台脚本生成器索引 / Platform script generators index
    /**
     * 获取平台脚本生成器 / Get platform script generator
     */
    function getGenerator(platform) {
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

    // 导出脚本包工具 / Export script package utilities
    /**
     * 从 Base64 Data URL 提取二进制数据 / Extract binary data from Base64 Data URL
     */
    function base64ToUint8Array(dataUrl) {
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
    async function fetchAudioData(url) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    }
    /**
     * 收集音频文件 / Collect audio files
     */
    async function collectAudioFiles(config) {
        const zipEntries = [];
        const collectedFiles = new Map();
        for (const soundName of SOUND_FILES) {
            const soundConfig = config.sounds[soundName];
            if (!soundConfig || soundConfig.sources.length === 0)
                continue;
            const targetFilename = SOUND_FILENAMES[soundName];
            const baseName = targetFilename.replace(/\.wav$/, '');
            const sources = [];
            const weights = [];
            let firstFileData = null;
            for (let i = 0; i < soundConfig.sources.length; i++) {
                const source = soundConfig.sources[i];
                if (!source.url)
                    continue;
                try {
                    let data;
                    if (source.url.startsWith('data:')) {
                        data = base64ToUint8Array(source.url);
                    }
                    else {
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
                }
                catch (error) {
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
    function buildAudioInfos(config, collectedFiles) {
        const audioInfos = [];
        for (const soundName of SOUND_FILES) {
            const soundConfig = config.sounds[soundName];
            if (!soundConfig || soundConfig.sources.length === 0)
                continue;
            const targetFilename = SOUND_FILENAMES[soundName];
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
    async function exportScriptPackage(config, platform = 'windows') {
        // 获取平台生成器 / Get platform generator
        const generator = getGenerator(platform);
        // 收集音频文件 / Collect audio files
        const { zipEntries, collectedFiles } = await collectAudioFiles(config);
        // 预置第一个音频文件为目标文件 / Pre-place first audio as target file
        for (const soundName of SOUND_FILES) {
            const collected = collectedFiles.get(soundName);
            if (!collected || !collected.firstFileData)
                continue;
            const targetFilename = SOUND_FILENAMES[soundName];
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

    // 设置面板组件 / Settings panel component
    let panelInstance = null;
    /**
     * 创建开关组件 / Create toggle switch
     */
    function createSwitch(checked, onChange) {
        const sw = createElement('div', `vksr-switch${checked ? ' active' : ''}`);
        on(sw, 'click', () => {
            const newState = !sw.classList.contains('active');
            sw.classList.toggle('active', newState);
            onChange(newState);
        });
        return sw;
    }
    /**
     * 显示输入选择对话框 / Show input selection dialog
     * @param currentUrl - 当前已配置的 URL（用于编辑时显示）/ Current configured URL (for editing)
     * @param onConfirm - 确认回调 / Confirm callback
     */
    function showSourceInputDialog(onConfirm, currentUrl) {
        // 创建对话框遮罩 / Create dialog overlay
        const dialogOverlay = createElement('div', 'vksr-dialog-overlay');
        const dialog = createElement('div', 'vksr-dialog');
        // 标题 / Title
        const title = createElement('div', 'vksr-dialog-title');
        title.textContent = currentUrl ? '编辑音源 Edit Source' : '添加音源 Add Source';
        // 选项容器 / Options container
        const options = createElement('div', 'vksr-dialog-options');
        // 当前配置提示 / Current config hint
        if (currentUrl) {
            const currentHint = createElement('div', 'vksr-dialog-hint');
            if (currentUrl.startsWith('data:')) {
                currentHint.textContent = '当前: 本地文件 / Current: Local file';
            }
            else {
                currentHint.textContent = `当前 Current: ${currentUrl.length > 40 ? currentUrl.slice(0, 40) + '...' : currentUrl}`;
            }
            currentHint.title = currentUrl;
            options.appendChild(currentHint);
        }
        // 选择本地文件按钮 / Select local file button
        const fileBtn = createElement('button', 'vksr-dialog-btn');
        fileBtn.textContent = '选择本地文件 Select File';
        on(fileBtn, 'click', async () => {
            const file = await openFilePicker('audio/*');
            if (file) {
                const base64 = await fileToBase64(file);
                dialogOverlay.remove();
                onConfirm(base64, file.name);
            }
        });
        // 分隔线 / Divider
        const divider = createElement('div', 'vksr-dialog-divider');
        divider.textContent = '或 OR';
        // URL 输入框 / URL input
        const urlInput = createElement('input', 'vksr-dialog-input');
        urlInput.type = 'text';
        urlInput.placeholder = '输入音频 URL / Enter audio URL';
        // 如果当前是 URL（非 base64），预填充 / Pre-fill if current is URL (not base64)
        if (currentUrl && !currentUrl.startsWith('data:')) {
            urlInput.value = currentUrl;
        }
        // 确认 URL 按钮 / Confirm URL button
        const urlBtn = createElement('button', 'vksr-dialog-btn primary');
        urlBtn.textContent = '使用 URL Use URL';
        on(urlBtn, 'click', () => {
            const url = urlInput.value.trim();
            if (url) {
                dialogOverlay.remove();
                onConfirm(url);
            }
        });
        // 取消按钮 / Cancel button
        const cancelBtn = createElement('button', 'vksr-dialog-btn');
        cancelBtn.textContent = '取消 Cancel';
        on(cancelBtn, 'click', () => {
            dialogOverlay.remove();
        });
        options.appendChild(fileBtn);
        options.appendChild(divider);
        options.appendChild(urlInput);
        options.appendChild(urlBtn);
        options.appendChild(cancelBtn);
        dialog.appendChild(title);
        dialog.appendChild(options);
        dialogOverlay.appendChild(dialog);
        // 点击遮罩关闭 / Click overlay to close
        on(dialogOverlay, 'click', (e) => {
            if (e.target === dialogOverlay) {
                dialogOverlay.remove();
            }
        });
        document.body.appendChild(dialogOverlay);
        urlInput.focus();
    }
    /**
     * 创建音源项 / Create source item
     */
    function createSourceItem(source, index, soundConfig, config, onUpdate) {
        const item = createElement('div', 'vksr-source-item');
        // 用于试听的 Audio 实例 / Audio instance for preview
        let previewAudio = null;
        // 名称输入框 / Name input
        const nameInput = createElement('input', 'vksr-source-name-input');
        nameInput.type = 'text';
        nameInput.value = source.name || '';
        nameInput.placeholder = '名称 Name';
        nameInput.title = '自定义名称 Custom name';
        on(nameInput, 'change', () => {
            source.name = nameInput.value.trim() || undefined;
            saveConfig(config);
        });
        // 音源选择按钮 / Source select button
        const sourceBtn = createElement('button', `vksr-source-btn${source.url ? '' : ' placeholder'}`);
        sourceBtn.textContent = source.url ? (source.url.startsWith('data:') ? '已选择文件' : 'URL') : '选择音源';
        sourceBtn.title = source.url || '点击选择 Click to select';
        on(sourceBtn, 'click', () => {
            // 传入当前 URL 以便编辑时参考 / Pass current URL for reference when editing
            showSourceInputDialog((url, fileName) => {
                source.url = url;
                // 如果用户没有自定义名称，自动使用文件名 / Auto use filename if no custom name
                if (!source.name && fileName) {
                    source.name = fileName;
                    nameInput.value = fileName;
                }
                saveConfig(config);
                onUpdate();
            }, source.url);
        });
        // 试听按钮 / Preview button
        const previewBtn = createElement('button', 'vksr-icon-btn');
        previewBtn.textContent = '▶';
        previewBtn.title = '试听 Preview';
        on(previewBtn, 'click', () => {
            if (!source.url)
                return;
            // 如果正在播放，停止 / If playing, stop
            if (previewAudio && !previewAudio.paused) {
                previewAudio.pause();
                previewAudio.currentTime = 0;
                previewBtn.textContent = '▶';
                previewBtn.classList.remove('playing');
                return;
            }
            // 播放音频 / Play audio
            previewAudio = new Audio(source.url);
            previewBtn.textContent = '■';
            previewBtn.classList.add('playing');
            previewAudio.play().catch(() => {
                previewBtn.textContent = '▶';
                previewBtn.classList.remove('playing');
            });
            previewAudio.onended = () => {
                previewBtn.textContent = '▶';
                previewBtn.classList.remove('playing');
            };
        });
        // 权重输入 / Weight input
        const weightInput = createElement('input', 'vksr-weight-input');
        weightInput.type = 'number';
        weightInput.min = '1';
        weightInput.value = String(source.weight || 1);
        weightInput.title = '权重 Weight';
        on(weightInput, 'change', () => {
            source.weight = parseInt(weightInput.value) || 1;
            saveConfig(config);
        });
        // 删除按钮 / Delete button
        const deleteBtn = createElement('button', 'vksr-icon-btn danger');
        deleteBtn.textContent = '✕';
        deleteBtn.title = '删除 Delete';
        on(deleteBtn, 'click', () => {
            // 停止试听 / Stop preview
            if (previewAudio) {
                previewAudio.pause();
                previewAudio = null;
            }
            soundConfig.sources.splice(index, 1);
            saveConfig(config);
            onUpdate();
        });
        item.appendChild(nameInput);
        item.appendChild(sourceBtn);
        item.appendChild(weightInput);
        item.appendChild(previewBtn);
        item.appendChild(deleteBtn);
        return item;
    }
    /**
     * 创建音效卡片 / Create sound card
     */
    function createSoundCard(soundName, config) {
        const soundConfig = config.sounds[soundName];
        const card = createElement('div', 'vksr-sound-card');
        // 头部 / Header
        const header = createElement('div', 'vksr-sound-header');
        const name = createElement('span', 'vksr-sound-name');
        name.textContent = SOUND_DISPLAY_NAMES[soundName] || soundName;
        const meta = createElement('div', 'vksr-sound-meta');
        const count = createElement('span', 'vksr-sound-count');
        const updateCount = () => {
            count.textContent = `${soundConfig.sources.length} 项`;
        };
        updateCount();
        const expandIcon = createElement('span', 'vksr-expand-icon');
        expandIcon.textContent = '▼';
        meta.appendChild(count);
        meta.appendChild(expandIcon);
        header.appendChild(name);
        header.appendChild(meta);
        // 内容区 / Body
        const body = createElement('div', 'vksr-sound-body');
        // 模式选择 / Mode select
        const modeRow = createElement('div', 'vksr-mode-row');
        const modeLabel = createElement('span', 'vksr-mode-label');
        modeLabel.textContent = 'MODE';
        const modeSelect = createElement('select', 'vksr-select');
        Object.entries(MODE_DISPLAY_NAMES).forEach(([value, label]) => {
            const option = createElement('option');
            option.value = value;
            option.textContent = label;
            modeSelect.appendChild(option);
        });
        modeSelect.value = soundConfig.mode || 'single';
        on(modeSelect, 'change', () => {
            soundConfig.mode = modeSelect.value;
            saveConfig(config);
        });
        modeRow.appendChild(modeLabel);
        modeRow.appendChild(modeSelect);
        body.appendChild(modeRow);
        // 音源列表容器 / Sources container
        const sourcesContainer = createElement('div', 'vksr-sources-container');
        const renderSources = () => {
            sourcesContainer.innerHTML = '';
            soundConfig.sources.forEach((source, index) => {
                const item = createSourceItem(source, index, soundConfig, config, () => {
                    renderSources();
                    updateCount();
                });
                sourcesContainer.appendChild(item);
            });
            // 添加按钮 / Add button
            const addBtn = createElement('button', 'vksr-add-btn');
            addBtn.innerHTML = '<span>+</span> 添加音源 Add Source';
            on(addBtn, 'click', () => {
                showSourceInputDialog((url, name) => {
                    const newSource = { url, weight: 1 };
                    if (name) {
                        newSource.name = name;
                    }
                    soundConfig.sources.push(newSource);
                    saveConfig(config);
                    renderSources();
                    updateCount();
                });
            });
            sourcesContainer.appendChild(addBtn);
        };
        renderSources();
        body.appendChild(sourcesContainer);
        // 展开/收起 / Expand/collapse
        on(header, 'click', () => {
            const isExpanded = body.classList.contains('expanded');
            body.classList.toggle('expanded', !isExpanded);
            expandIcon.classList.toggle('expanded', !isExpanded);
        });
        card.appendChild(header);
        card.appendChild(body);
        return card;
    }
    /**
     * 创建设置面板 / Create settings panel
     */
    function createSettingsPanel() {
        // 如果已存在面板，先关闭 / Close existing panel if any
        if (panelInstance) {
            closeSettingsPanel();
        }
        injectStyles();
        const config = getConfig();
        // 遮罩层 / Overlay
        const overlay = createElement('div', 'vksr-overlay');
        on(overlay, 'click', closeSettingsPanel);
        // 面板 / Panel
        const panel = createElement('div', 'vksr-panel');
        on(panel, 'click', (e) => e.stopPropagation());
        // 头部 / Header
        const header = createElement('div', 'vksr-header');
        const title = createElement('h2', 'vksr-title');
        title.textContent = 'Sound Replacer';
        const closeBtn = createElement('button', 'vksr-close-btn');
        closeBtn.textContent = '✕';
        on(closeBtn, 'click', closeSettingsPanel);
        header.appendChild(title);
        header.appendChild(closeBtn);
        // 内容区 / Content
        const content = createElement('div', 'vksr-content');
        // 启用开关 / Enable toggle
        const toggleRow = createElement('div', 'vksr-toggle-row');
        const toggleLabel = createElement('span', 'vksr-toggle-label');
        toggleLabel.textContent = '启用 Enable';
        const toggle = createSwitch(config.enabled, (checked) => {
            config.enabled = checked;
            saveConfig(config);
        });
        toggleRow.appendChild(toggleLabel);
        toggleRow.appendChild(toggle);
        content.appendChild(toggleRow);
        // 音效卡片列表 / Sound cards
        SOUND_FILES.forEach(soundName => {
            const card = createSoundCard(soundName, config);
            content.appendChild(card);
        });
        // 底部 / Footer
        const footer = createElement('div', 'vksr-footer');
        const exportBtn = createElement('button', 'vksr-btn');
        exportBtn.textContent = '导出 Export';
        exportBtn.title = '导出配置 JSON / Export config JSON';
        on(exportBtn, 'click', () => {
            downloadJson(getConfig(), 'vksr-config.json');
        });
        const importBtn = createElement('button', 'vksr-btn');
        importBtn.textContent = '导入 Import';
        importBtn.title = '导入配置 JSON / Import config JSON';
        on(importBtn, 'click', async () => {
            const file = await openFilePicker('.json');
            if (file) {
                try {
                    const importedConfig = await readJsonFile(file);
                    saveConfig(importedConfig);
                    closeSettingsPanel();
                    createSettingsPanel(); // 重新打开以刷新 / Reopen to refresh
                }
                catch {
                    alert('配置文件格式错误 Invalid config format');
                }
            }
        });
        // 导出脚本按钮 / Export script button
        const exportScriptBtn = createElement('button', 'vksr-btn primary');
        exportScriptBtn.textContent = '导出脚本 Export Script';
        exportScriptBtn.title = '导出 Windows 通知脚本包 / Export Windows notification script package';
        on(exportScriptBtn, 'click', async () => {
            exportScriptBtn.textContent = '导出中...';
            exportScriptBtn.setAttribute('disabled', 'true');
            try {
                await exportScriptPackage(getConfig());
                exportScriptBtn.textContent = '导出脚本 Export Script';
            }
            catch (error) {
                console.error('Export script failed:', error);
                alert('导出失败，请检查控制台 / Export failed, check console');
                exportScriptBtn.textContent = '导出脚本 Export Script';
            }
            finally {
                exportScriptBtn.removeAttribute('disabled');
            }
        });
        footer.appendChild(exportBtn);
        footer.appendChild(importBtn);
        footer.appendChild(exportScriptBtn);
        // 重置按钮 / Reset button
        const resetBtn = createElement('button', 'vksr-btn danger');
        resetBtn.textContent = '重置 Reset';
        resetBtn.title = '重置为默认配置 Reset to default';
        on(resetBtn, 'click', () => {
            if (confirm('确定要重置所有配置吗？此操作不可撤销。\nAre you sure to reset all settings? This cannot be undone.')) {
                saveConfig(createDefaultConfig());
                closeSettingsPanel();
                createSettingsPanel(); // 重新打开以刷新 / Reopen to refresh
            }
        });
        footer.appendChild(resetBtn);
        // 组装面板 / Assemble panel
        panel.appendChild(header);
        panel.appendChild(content);
        panel.appendChild(footer);
        document.body.appendChild(overlay);
        document.body.appendChild(panel);
        panelInstance = { overlay, panel };
    }
    /**
     * 关闭设置面板 / Close settings panel
     */
    function closeSettingsPanel() {
        if (panelInstance) {
            remove(panelInstance.overlay);
            remove(panelInstance.panel);
            panelInstance = null;
        }
    }
    /**
     * 创建入口按钮 / Create entry button
     */
    function createEntryButton() {
        const btn = createElement('button', 'vksr-entry-btn');
        btn.textContent = '音效 Sounds';
        on(btn, 'click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            createSettingsPanel();
        });
        return btn;
    }

    // 设置页面注入模块 / Settings page injection module
    let injected = false;
    /**
     * 检查并注入入口按钮 / Check and inject entry button
     */
    function checkAndInject() {
        if (!isSettingsPage() || !hasSoundFileButton())
            return;
        const soundFileBtn = document.querySelector('button#sound-file');
        if (!soundFileBtn || soundFileBtn.getAttribute('data-vksr-injected'))
            return;
        soundFileBtn.setAttribute('data-vksr-injected', 'true');
        injectStyles();
        const entryBtn = createEntryButton();
        soundFileBtn.parentNode?.insertBefore(entryBtn, soundFileBtn.nextSibling);
        console.log('[VKSR] 入口按钮已注入 / Entry button injected');
        injected = true;
    }
    /**
     * 监听设置页面并注入配置按钮 / Watch settings page and inject config button
     */
    function watchSettingsPage() {
        // 初始检查 / Initial check
        checkAndInject();
        // 监听 DOM 变化 / Watch DOM changes
        const observer = new MutationObserver(() => {
            if (!injected) {
                checkAndInject();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        // 监听路由变化（SPA）/ Watch route changes (SPA)
        let lastPath = window.location.pathname;
        setInterval(() => {
            if (window.location.pathname !== lastPath) {
                lastPath = window.location.pathname;
                injected = false;
                checkAndInject();
            }
        }, 500);
    }

    // 主入口 / Main entry
    /**
     * DOM 加载完成后的处理 / Handler after DOM loaded
     */
    function onDOMReady() {
        // 延迟检测，确保页面内容加载完成 / Delay detection to ensure page content is loaded
        setTimeout(() => {
            if (isVibeKanban()) {
                console.log('[VKSR] 检测到 vibe-kanban 页面 / Detected vibe-kanban page');
                watchSettingsPage();
                // 在检测到 vibe-kanban 后注册菜单 / Register menu after detecting vibe-kanban
                try {
                    GM_registerMenuCommand('⚙️ 打开设置 / Open Settings', createSettingsPanel);
                }
                catch {
                    // 忽略错误 / Ignore error
                }
            }
        }, 1000);
    }
    /**
     * 主初始化函数 / Main initialization function
     */
    function init() {
        // 立即劫持 Audio（在 document-start 阶段）/ Hijack Audio immediately (at document-start)
        hijackAudio();
        // DOM 加载完成后执行 / Execute after DOM loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onDOMReady);
        }
        else {
            onDOMReady();
        }
    }
    // 启动 / Start
    init();

})();
