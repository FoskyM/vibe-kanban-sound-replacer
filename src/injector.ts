// 设置页面注入模块 / Settings page injection module

import { isSettingsPage, hasSoundFileButton } from './detector';
import { createEntryButton, injectStyles } from './ui';

let injected = false;

/**
 * 检查并注入入口按钮 / Check and inject entry button
 */
function checkAndInject(): void {
  if (!isSettingsPage() || !hasSoundFileButton()) return;

  const soundFileBtn = document.querySelector('button#sound-file');
  if (!soundFileBtn || soundFileBtn.getAttribute('data-vksr-injected')) return;

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
export function watchSettingsPage(): void {
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
