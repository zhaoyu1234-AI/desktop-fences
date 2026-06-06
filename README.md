# 桌面整理大师 (Desktop Fences)

一个类似腾讯桌面整理的 Windows 桌面图标管理工具，使用 Tauri 2.0 + React 构建。

## 功能特性

- 🖥️ **桌面图标扫描** - 自动读取桌面快捷方式和文件
- 📦 **分区管理** - 创建可拖拽、可调整大小的分区框
- 🎯 **图标收纳** - 拖拽图标到分区中进行分组
- ✨ **毛玻璃效果** - 半透明深色背景，与桌面壁纸完美融合
- 💾 **持久化存储** - 保存布局配置，重启后自动恢复
- 🚀 **一键启动** - 双击图标直接打开程序或文件

## 技术栈

- **框架**: Tauri 2.0
- **前端**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Framer Motion
- **拖拽**: @dnd-kit
- **存储**: SQLite
- **语言**: Rust + TypeScript

## 快速开始

### 环境要求

- Node.js 18+
- Rust 1.75+
- npm 或 pnpm

### 安装依赖

```bash
cd desktop-fences
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建发布

```bash
npm run tauri build
```

构建完成后，exe 文件在 `src-tauri/target/release/` 目录下。

## 使用说明

### 创建分区

1. 点击底部工具栏的 **"+"** 按钮
2. 或右键桌面空白处选择 **"新建分区"**

### 添加图标到分区

1. 从桌面拖拽图标到分区框中
2. 图标会自动排列在分区内

### 管理分区

- **移动分区**: 拖拽分区标题栏
- **调整大小**: 拖拽分区右下角
- **重命名**: 双击分区标题
- **删除分区**: 右键分区选择删除

### 启动程序

- 双击分区内的图标即可启动对应程序

## 项目结构

```
desktop-fences/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   │   ├── FenceBox.tsx   # 分区框组件
│   │   ├── IconItem.tsx   # 图标组件
│   │   ├── Toolbar.tsx    # 工具栏
│   │   └── ContextMenu.tsx # 右键菜单
│   ├── store/             # 状态管理
│   ├── App.tsx            # 主应用
│   └── types.ts           # 类型定义
├── src-tauri/             # Rust 后端
│   ├── src/
│   │   ├── lib.rs         # 核心逻辑
│   │   ├── db.rs          # 数据库
│   │   ├── desktop_scanner.rs # 图标扫描
│   │   └── fence_manager.rs # 分区管理
│   └── Cargo.toml         # Rust 依赖
└── package.json           # 前端依赖
```

## 配置说明

### 分区配置

分区配置存储在 SQLite 数据库中，位置：
```
%APPDATA%/desktop-fences/fences.db
```

### 自定义样式

修改 `src/index.css` 中的 CSS 变量可以自定义：
- 分区背景颜色和透明度
- 图标大小和间距
- 毛玻璃效果强度

## 开发计划

- [x] 基础分区功能
- [x] 图标拖拽
- [x] 毛玻璃效果
- [ ] 图标提取（从 exe/lnk）
- [ ] 自动分类
- [ ] 主题切换
- [ ] 多显示器支持
- [ ] 开机自启动

## 许可证

MIT License
