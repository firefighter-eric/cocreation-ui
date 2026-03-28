# 共创故事 App

一个基于 `React + Vite + TypeScript` 的前端应用，用 ChatGPT 风格界面实现“人与 AI 轮流接龙写故事”。

## 功能

- 左侧设置栏切换开场句和创作风格
- 右侧聊天式故事流展示共创过程
- 严格短句规则：默认 `20` 字内、禁止标点
- 支持 OpenAI-compatible 接口
- 没有配置远程模型时自动降级到本地 mock

## 环境变量

复制 `.env.example` 为 `.env`，填入以下内容：

```bash
VITE_LLM_BASE_URL=https://api.openai.com/v1
VITE_LLM_API_KEY=your_api_key_here
VITE_LLM_MODEL=gpt-4.1-mini
```

如果未配置 `API_KEY` 或 `BASE_URL`，应用会使用本地 mock provider，方便先跑通 UI 和交互。

## 启动

```bash
npm install
npm run dev
```

## 检查

```bash
npm run build
npm run lint
npm test
```

## 目录结构

```text
src/
  app/                    应用入口与集成测试
  entities/               核心类型与纯状态机
  features/               UI 功能模块
  shared/config/          默认配置和环境变量
  shared/lib/llm/         provider、prompt、接口抽象
  shared/lib/storage/     会话存储抽象
  shared/lib/validation/  输入输出规则校验
```
