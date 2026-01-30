// 页面检测模块 / Page detection module

/**
 * 检测当前页面是否为 vibe-kanban / Detect if current page is vibe-kanban
 */
export function isVibeKanban(): boolean {
  // 检查标题 / Check title
  if (document.title && document.title.toLowerCase().includes('vibe-kanban')) {
    return true;
  }

  // 检查页面中的脚本 / Check scripts in page
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  for (const script of scripts) {
    const src = (script as HTMLScriptElement).src;
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
export function isSettingsPage(): boolean {
  return window.location.pathname === '/settings/general';
}

/**
 * 检查是否存在音效选择按钮 / Check if sound file button exists
 */
export function hasSoundFileButton(): boolean {
  return !!document.querySelector('button#sound-file');
}
