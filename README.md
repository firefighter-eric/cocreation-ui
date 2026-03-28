# 共创故事 App

一个基于 `React + Vite + TypeScript` 的前端应用，用接近 ChatGPT 的白色双栏界面实现“短句故事接龙”。

核心文档：

- [产品设计文档](/Users/eric/projects/cocreation-ui/docs/product-design.md)
- [导出字段文档](/Users/eric/projects/cocreation-ui/docs/export-schema.md)
- [协作约束](/Users/eric/projects/cocreation-ui/AGENTS.md)

## 功能

- 三种模式：`与AI对话`、`与人对话`、`AI自动对话`
- 左侧栏用于切换模式、选择开场句、重新开始
- 右侧以聊天式故事流展示当前共创过程
- 右上角支持打开设置抽屉，修改完整 `system prompt`、创作风格、`temperature`、`top_p`
- 严格短句规则：默认 `20` 字内、禁止标点
- 支持导出完整会话 JSON
- 支持 OpenAI-compatible 接口
- 没有配置远程模型时自动降级到本地 mock

## 当前交互

- `与AI对话`：先点“开始”，再由你输入一句、AI 续写一句
- `与人对话`：流程与手动模式一致，但前台按“对方”语义呈现
- `AI自动对话`：输入 `1-10` 轮，自动生成一组示例对话
- 开场句不是写进 `system prompt`，而是作为请求里的第一条 `user` message
- 设置抽屉里看到的 `system prompt`，就是后续真实发给模型的完整系统提示

## 环境变量

复制 `.env.example` 为 `.env`，填入以下内容：

```bash
VITE_LLM_BASE_URL=https://api.openai.com/v1
VITE_LLM_API_KEY=your_api_key_here
VITE_LLM_MODEL=gpt-4.1-mini
```

如果未配置 `API_KEY` 或 `BASE_URL`，应用会使用本地 mock provider，方便先跑通 UI 和交互。

## 导出

- 当前只导出一个文件：`cocreation-yymmdd-hhmmss.json`
- JSON 顶层包含会话元信息、规则、seed、模型参数和完整对话
- `conversation[0]` 固定为开场句，格式为 `role: "user"` 且 `is_opening: true`
- 详细字段见 [docs/export-schema.md](/Users/eric/projects/cocreation-ui/docs/export-schema.md)

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

docs/
  product-design.md       产品规则与交互基线
  export-schema.md        JSON 导出字段说明
