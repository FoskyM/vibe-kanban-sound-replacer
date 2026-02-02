# Vibe Kanban Sound Replacer

一个用于替换 [vibe-kanban](https://github.com/BloopAI/vibe-kanban) 音效的油猴脚本。

A Tampermonkey script for replacing sound effects in vibe-kanban.

## 工作原理 / How It Works

### 网页端音效替换 / Web Audio Replacement

本插件通过劫持 `window.Audio` 构造函数来拦截音频播放请求，根据配置替换为自定义音频。这种方式适用于网页端的音效替换。

This plugin hijacks the `window.Audio` constructor to intercept audio playback requests and replace them with custom audio based on your configuration. This approach works for web-based audio replacement.

### 桌面端音效替换 / Desktop Audio Replacement

**重要说明**：Vibe Kanban 桌面应用的音效播放由 Rust 后端处理，而非浏览器的 `window.Audio`，因此网页端的劫持方式对桌面应用无效。

**Important**: The Vibe Kanban desktop app plays audio through the Rust backend, not the browser's `window.Audio`, so the web-based hijacking approach does not work for the desktop app.

为解决此问题，本插件提供了「导出脚本」功能，可生成平台特定的通知脚本包。该脚本会在每次通知时替换音频文件，从而实现桌面端的音效替换。

To address this, the plugin provides an "Export Script" feature that generates platform-specific notification script packages. The script replaces audio files on each notification, enabling audio replacement for the desktop app.

### 平台支持 / Platform Support

| 平台 / Platform | 网页端 / Web | 桌面端 / Desktop |
|----------------|-------------|-----------------|
| Windows | ✅ 支持 | ✅ 支持 (PowerShell 脚本) |
| macOS | ✅ 支持 | 🔜 计划中 |
| Linux | ✅ 支持 | 🔜 计划中 |

## 功能特性 / Features

- **自动检测 / Auto Detection**: 通过网页标题或 JS 内容自动检测 vibe-kanban 页面 (Automatically detect vibe-kanban pages by title or JS content)
- **音频劫持 / Audio Hijacking**: 劫持 `window.Audio` 以播放自定义音频 (Hijack `window.Audio` to play custom audio)
- **多种音源支持 / Multiple Sources**: 支持本地文件选择或在线 URL (Support local file picker or online URLs)
- **灵活映射 / Flexible Mapping**: 支持多项映射、随机播放、轮询、权重等模式 (Support multiple mappings, random play, sequence, weighted modes)
- **可视化配置 / Visual Config**: 在设置页面提供可视化配置界面 (Provide visual configuration UI in settings page)
- **主题适配 / Theme Support**: 自动适配浅色/深色主题 (Automatically adapt to light/dark theme)
- **移动端适配 / Mobile Friendly**: 响应式设计，支持移动端使用 (Responsive design, mobile-friendly)
- **导出脚本 / Export Script**: 导出桌面端通知脚本包 (Export desktop notification script package)

## 支持的音效 / Supported Sounds

| 音效 ID / Sound ID | 描述 / Description |
|-------------------|---------------------|
| `ABSTRACT_SOUND1` | 抽象音效 1 / Abstract Sound 1 |
| `ABSTRACT_SOUND2` | 抽象音效 2 / Abstract Sound 2 |
| `ABSTRACT_SOUND3` | 抽象音效 3 / Abstract Sound 3 |
| `ABSTRACT_SOUND4` | 抽象音效 4 / Abstract Sound 4 |
| `COW_MOOING` | 牛叫声 / Cow Mooing |
| `PHONE_VIBRATION` | 手机振动 / Phone Vibration |
| `ROOSTER` | 公鸡打鸣 / Rooster Crowing |

## 安装 / Installation

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展 (Install Tampermonkey browser extension)
2. 点击 [安装脚本](https://github.com/FoskyM/vibe-kanban-sound-replacer/raw/main/dist/vibe-kanban-sound-replacer.user.js)，油猴会自动弹出安装页面 (Click [Install Script](https://github.com/FoskyM/vibe-kanban-sound-replacer/raw/main/dist/vibe-kanban-sound-replacer.user.js), Tampermonkey will automatically pop up the installation page)
3. 点击「安装」按钮完成安装 (Click the "Install" button to complete the installation)

## 配置说明 / Configuration

### 播放模式 / Play Modes

- **single**: 单一音频，始终播放第一个配置的音频 (Single audio, always play the first configured audio)
- **random**: 随机播放，从配置列表中随机选择 (Random play, randomly select from the configuration list)
- **sequence**: 顺序轮询，按顺序循环播放 (Sequential polling, play in order cyclically)
- **weighted**: 权重随机，根据权重值随机选择 (Weighted random, randomly select based on weight values)

### 设置界面 / Settings UI

访问 `/settings/general` 页面，点击「音效 Sounds」按钮即可打开音效配置面板。也可以通过油猴扩展菜单打开设置。

Visit the `/settings/general` page and click the "音效 Sounds" button to open the sound configuration panel. You can also open settings via the Tampermonkey extension menu.

### 添加音源 / Adding Sources

1. 展开对应的音效卡片 (Expand the corresponding sound card)
2. 点击「添加音源 Add Source」按钮 (Click "添加音源 Add Source" button)
3. 在弹出的文件选择器中选择本地音频文件 (Select local audio file in the file picker)
4. 可选：调整权重值（用于权重模式）(Optional: adjust weight value for weighted mode)

### 导入导出 / Import & Export

支持将配置导出为 JSON 文件，方便备份和迁移。

Support exporting configuration as JSON file for backup and migration.

### 导出脚本 (桌面端) / Export Script (Desktop)

针对桌面应用，可导出通知脚本包来实现音效替换：

For desktop apps, you can export a notification script package to enable audio replacement:

1. 在设置面板中配置好音效 (Configure sounds in the settings panel)
2. 点击「导出脚本 Export Script」按钮 (Click "导出脚本 Export Script" button)
3. 下载并解压 ZIP 包 (Download and extract the ZIP package)
4. 按照 README.md 说明安装到 Vibe Kanban 目录 (Follow README.md instructions to install)

**注意**：导出时所有音频文件会自动转换为 WAV 格式以确保兼容性。

**Note**: All audio files are automatically converted to WAV format during export for compatibility.

## 开发 / Development

```bash
# 安装依赖 / Install dependencies
npm install

# 开发模式 / Development mode
npm run dev

# 构建 / Build
npm run build
```

## 贡献音源与预设 / Contributing Sources & Presets

欢迎提交你的音源文件和配置预设！

Welcome to submit your audio sources and configuration presets!

### 目录结构 / Directory Structure

- `source/` - 音源文件目录，存放 mp3/wav 等音频文件 (Audio source files like mp3/wav)
- `presets/` - 预设配置目录，存放 JSON 配置文件 (Preset configuration JSON files)

### 如何贡献 / How to Contribute

1. Fork 本仓库 (Fork this repository)
2. 将音源文件添加到 `source/` 目录 (Add audio files to `source/` directory)
3. 或将预设配置添加到 `presets/` 目录 (Or add preset configs to `presets/` directory)
4. 提交 Pull Request (Submit a Pull Request)

### 预设格式 / Preset Format

预设文件为 JSON 格式，可通过插件的「导出」功能生成。

Preset files are in JSON format, which can be generated via the "Export" function in the plugin.

## 作者 / Author

- **FoskyM** - [i@fosky.top](mailto:i@fosky.top)
- GitHub: [https://github.com/FoskyM](https://github.com/FoskyM)

## 许可证 / License

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
