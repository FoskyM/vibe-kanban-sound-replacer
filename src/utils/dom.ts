// DOM 工具模块 / DOM utilities module

/**
 * 创建元素 / Create element
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  attrs?: Record<string, string>
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
  }
  return el;
}

/**
 * 设置元素文本 / Set element text
 */
export function setText(el: HTMLElement, text: string): HTMLElement {
  el.textContent = text;
  return el;
}

/**
 * 添加事件监听 / Add event listener
 */
export function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void
): void {
  el.addEventListener(event, handler);
}

/**
 * 移除元素 / Remove element
 */
export function remove(el: HTMLElement | null): void {
  el?.remove();
}

/**
 * 查询元素 / Query element
 */
export function $(selector: string, parent: ParentNode = document): HTMLElement | null {
  return parent.querySelector(selector);
}

/**
 * 查询所有元素 / Query all elements
 */
export function $$(selector: string, parent: ParentNode = document): HTMLElement[] {
  return Array.from(parent.querySelectorAll(selector));
}
