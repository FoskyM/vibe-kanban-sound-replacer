// 设置面板组件 / Settings panel component

import { getConfig, saveConfig, createDefaultConfig } from '../config';
import { SOUND_FILES, SOUND_DISPLAY_NAMES, MODE_DISPLAY_NAMES } from '../constants';
import { Config, SoundConfig, AudioSource, PlayMode } from '../types';
import { injectStyles } from './styles';
import { createElement, on, remove } from '../utils/dom';
import { fileToBase64, getDisplayName, openFilePicker, downloadJson, readJsonFile } from '../utils/file';

let panelInstance: { overlay: HTMLElement; panel: HTMLElement } | null = null;

/**
 * 创建开关组件 / Create toggle switch
 */
function createSwitch(checked: boolean, onChange: (checked: boolean) => void): HTMLElement {
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
function showSourceInputDialog(
  onConfirm: (url: string, name?: string) => void,
  currentUrl?: string
): void {
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
    } else {
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
  const urlInput = createElement('input', 'vksr-dialog-input') as HTMLInputElement;
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
function createSourceItem(
  source: AudioSource,
  index: number,
  soundConfig: SoundConfig,
  config: Config,
  onUpdate: () => void
): HTMLElement {
  const item = createElement('div', 'vksr-source-item');

  // 用于试听的 Audio 实例 / Audio instance for preview
  let previewAudio: HTMLAudioElement | null = null;

  // 名称输入框 / Name input
  const nameInput = createElement('input', 'vksr-source-name-input') as HTMLInputElement;
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
    if (!source.url) return;

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
  const weightInput = createElement('input', 'vksr-weight-input') as HTMLInputElement;
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
function createSoundCard(soundName: string, config: Config): HTMLElement {
  const soundConfig = config.sounds[soundName];
  const card = createElement('div', 'vksr-sound-card');

  // 头部 / Header
  const header = createElement('div', 'vksr-sound-header');

  const name = createElement('span', 'vksr-sound-name');
  name.textContent = SOUND_DISPLAY_NAMES[soundName as keyof typeof SOUND_DISPLAY_NAMES] || soundName;

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

  const modeSelect = createElement('select', 'vksr-select') as HTMLSelectElement;
  Object.entries(MODE_DISPLAY_NAMES).forEach(([value, label]) => {
    const option = createElement('option');
    option.value = value;
    option.textContent = label;
    modeSelect.appendChild(option);
  });
  modeSelect.value = soundConfig.mode || 'single';
  on(modeSelect, 'change', () => {
    soundConfig.mode = modeSelect.value as PlayMode;
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
        const newSource: AudioSource = { url, weight: 1 };
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
export function createSettingsPanel(): void {
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
        const importedConfig = await readJsonFile<Config>(file);
        saveConfig(importedConfig);
        closeSettingsPanel();
        createSettingsPanel(); // 重新打开以刷新 / Reopen to refresh
      } catch {
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
export function closeSettingsPanel(): void {
  if (panelInstance) {
    remove(panelInstance.overlay);
    remove(panelInstance.panel);
    panelInstance = null;
  }
}

/**
 * 创建入口按钮 / Create entry button
 */
export function createEntryButton(): HTMLElement {
  const btn = createElement('button', 'vksr-entry-btn');
  btn.textContent = '音效 Sounds';
  on(btn, 'click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    createSettingsPanel();
  });
  return btn;
}
