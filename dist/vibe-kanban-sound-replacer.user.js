// ==UserScript==
// @name        Vibe Kanban Sound Replacer
// @description 替换 vibe-kanban 的音效 / Replace sound effects in vibe-kanban
// @namespace   https://github.com/FoskyM/vibe-kanban-sound-replacer
// @match       *://*/*
// @run-at      document-start
// @license     MIT
// @version     1.0.0
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
        on(exportBtn, 'click', () => {
            downloadJson(getConfig(), 'vksr-config.json');
        });
        const importBtn = createElement('button', 'vksr-btn');
        importBtn.textContent = '导入 Import';
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
        footer.appendChild(exportBtn);
        footer.appendChild(importBtn);
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
