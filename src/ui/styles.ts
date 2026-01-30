// UI 样式模块 / UI styles module

/**
 * 基础样式 / Base styles
 */
export const baseStyles = `
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
export function injectStyles(): void {
  if (document.getElementById('vksr-styles')) return;

  const style = document.createElement('style');
  style.id = 'vksr-styles';
  style.textContent = baseStyles;
  document.head.appendChild(style);
}
