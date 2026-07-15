# Gemini 图片交互界面

基于 Google Gemini 1.5 Flash 构建的图片交互分析应用，支持上传图片并与 AI 进行自然语言交互。

## 功能特性

- 🖼️ 支持拖拽或点击上传图片
- 💬 与上传的图片进行自然语言对话
- 🔍 使用 Gemini 1.5 Flash 进行图片分析
- 🎨 现代化的 UI 设计，支持渐变背景和流畅动画
- 🔐 API Key 本地存储，无需重复配置

## 技术栈

- React 18 + TypeScript
- Vite 5
- TailwindCSS 3
- Google Gemini API

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

前往 [Google AI Studio](https://ai.google.dev/) 获取您的 Gemini API Key。

### 3. 运行开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

## 使用说明

1. 打开应用后，首先配置您的 Gemini API Key
2. 上传图片（支持拖拽或点击选择）
3. 在聊天界面中输入关于图片的问题
4. Gemini 将分析图片并给出智能回复

## 项目结构

```
src/
├── components/
│   ├── ApiKeyModal.tsx    # API Key 配置弹窗
│   ├── ChatInterface.tsx  # 聊天交互界面
│   └── ImageUploader.tsx  # 图片上传组件
├── lib/
│   └── gemini.ts          # Gemini API 集成
├── App.tsx                # 主应用组件
├── main.tsx               # 入口文件
└── index.css              # 全局样式
```

## 示例问题

上传图片后，您可以问：
- "这张图片里有什么？"
- "描述一下这张图片的内容"
- "图片中的人物在做什么？"
- "帮我分析这张图片的构图"

## 注意事项

- 请确保您的 API Key 有足够的配额
- 建议使用 PNG 或 JPG 格式的图片
- 图片大小建议不超过 10MB
