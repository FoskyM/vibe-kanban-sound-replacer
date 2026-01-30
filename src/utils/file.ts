// 文件工具模块 / File utilities module

/**
 * 将文件转换为 Base64 Data URL / Convert file to Base64 Data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 从 Data URL 中提取文件名 / Extract filename from name or generate one
 */
export function getDisplayName(source: { url: string; name?: string }): string {
  if (source.name) return source.name;

  // 如果是 base64，显示简短标识 / If base64, show short identifier
  if (source.url.startsWith('data:')) {
    return 'Local Audio';
  }

  // 尝试从 URL 提取文件名 / Try to extract filename from URL
  try {
    const url = new URL(source.url);
    const pathname = url.pathname;
    const filename = pathname.split('/').pop();
    if (filename) return decodeURIComponent(filename);
  } catch {
    // 忽略解析错误 / Ignore parse error
  }

  return source.url.slice(0, 30) + (source.url.length > 30 ? '...' : '');
}

/**
 * 打开文件选择器 / Open file picker
 */
export function openFilePicker(accept: string = 'audio/*'): Promise<File | null> {
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
export function downloadJson(data: object, filename: string): void {
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
export function readJsonFile<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        resolve(data);
      } catch (e) {
        reject(new Error('Invalid JSON format'));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
