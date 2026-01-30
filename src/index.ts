// 主入口 / Main entry

import { hijackAudio } from './audio';
import { isVibeKanban } from './detector';
import { watchSettingsPage } from './injector';
import { createSettingsPanel } from './ui';

// 标记是否为 vibe-kanban 页面 / Flag for vibe-kanban page
let isVibeKanbanPage = false;

/**
 * DOM 加载完成后的处理 / Handler after DOM loaded
 */
function onDOMReady(): void {
  // 延迟检测，确保页面内容加载完成 / Delay detection to ensure page content is loaded
  setTimeout(() => {
    if (isVibeKanban()) {
      console.log('[VKSR] 检测到 vibe-kanban 页面 / Detected vibe-kanban page');
      isVibeKanbanPage = true;
      watchSettingsPage();

      // 在检测到 vibe-kanban 后注册菜单 / Register menu after detecting vibe-kanban
      try {
        GM_registerMenuCommand('⚙️ 打开设置 / Open Settings', createSettingsPanel);
      } catch {
        // 忽略错误 / Ignore error
      }
    }
  }, 1000);
}

/**
 * 主初始化函数 / Main initialization function
 */
function init(): void {
  // 立即劫持 Audio（在 document-start 阶段）/ Hijack Audio immediately (at document-start)
  hijackAudio();

  // DOM 加载完成后执行 / Execute after DOM loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
  } else {
    onDOMReady();
  }
}

// 启动 / Start
init();
