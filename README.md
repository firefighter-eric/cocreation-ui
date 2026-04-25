# 共创故事 App

一个基于 `React + Vite + TypeScript` 的前端应用，用接近 ChatGPT 的白色双栏界面实现“短句故事接龙”。

核心文档：

- [产品设计文档](/Users/eric/projects/cocreation-ui/docs/product-design.md)
- [导出字段文档](/Users/eric/projects/cocreation-ui/docs/export-schema.md)
- [协作约束](/Users/eric/projects/cocreation-ui/AGENTS.md)

## 功能

- 三种前台模式：`模式1`、`模式2`、`模式3`
  - `模式1` = `human_like` / 与人对话语义
  - `模式2` = `manual` / 与 AI 对话
  - `模式3` = `auto` / AI 自动对话
- 支持正式实验入口，可选择 `模式1` 或 `模式2`，连续完成全部题目
- 左侧栏用于切换模式、选择开场句、重新开始
- 右侧以聊天式故事流展示当前共创过程
- 右上角支持打开设置抽屉，修改完整 `system prompt`、创作风格、`model`、`temperature`、`top_p`、`max_tokens` 和模式1回复延迟倍率；这些普通设置会保存在浏览器 `localStorage` 的 `cocreation.story_settings`
- 设置抽屉中的修改会立即应用到后续会话，底部提供“还原默认”按钮
- 设置抽屉支持切换前台模式名称显示方式：默认 `模式1/模式2/模式3`，也可显示为描述性名称
- 设置抽屉支持填写自定义 `base URL` 和 `API key`，并保存在浏览器本地
- 设置抽屉支持从当前接口拉取候选模型，也支持手动填写模型名
- 严格短句规则：默认 `20` 字内、禁止标点、禁止空输入
- 支持导出完整会话 JSON
- 支持 OpenAI-compatible 接口
- 没有配置远程模型时自动降级到本地 mock

## 当前默认配置

- 默认模式：`manual`，前台显示为 `模式2`
- 默认风格：`creative` / 脑洞跳脱
- 默认规则：`maxChars = 20`，`punctuationAllowed = false`
- 默认最大回合数：`5`，范围 `1-10`
- 默认起手方：`random`，每次新会话开始时解析为 `user` 或 `assistant`
- 默认模式1回复延迟倍率：`2`，范围 `0.5-5`
- 默认模型参数：`temperature = 1.5`、`top_p = 1.0`、`max_tokens = 8000`
- 默认模型名：环境变量 `VITE_LLM_MODEL`，未配置时为 `deepseek-v4-flash`
- 远端聊天请求超时：`20s`
- 候选模型列表请求超时：`10s`，最多展示 `12` 个模型

当前 6 个启动语句来自 `src/shared/config/story.ts`：

| id | openingLine |
| --- | --- |
| `taxi` | 一辆出租车停在路边 |
| `hallway-light` | 走廊尽头的感应灯亮了起来 |
| `traffic-light` | 我在路边等红绿灯 |
| `email` | 今天我收到了一封电子邮件 |
| `clock` | 墙上的挂钟刚刚敲响 |
| `tv` | 电视屏幕突然闪烁了一下 |

## 当前交互

- `正式实验`：点击左侧“开始实验”后，选择 `模式1` 或 `模式2`，前台只显示中性模式与题目进度；内部仍会按实验计划推进全部题目
- 正式实验需要先在 playground 中配好参数再开始；开始后会默认收起左侧栏，也不能再打开左栏或设置抽屉
- 退出正式实验后会自动展开左侧栏，回到可继续调整的 playground
- `模式1`：流程与手动模式一致，但前台按“对方”语义呈现；如果由对方先开始，会先显示等待对方进场，再进入对方输入状态
- `模式2`：先点“开始”，再由你输入一句、AI 续写一句；如果设置为对方先开始，点击开始后先生成对方第一句
- `模式3`：按当前最大回合数自动生成一组示例对话，每回合是一组“用户一句 + 对方一句”
- 当前单题界面继续作为 playground，可自由切模式、换 seed、改设置和单题导出
- 模式名称显示只影响前台文案，不改变底层模式值和导出结构
- 开场句不是写进 `system prompt`，而是作为请求里的第一条 `user` message
- 设置抽屉里看到的 `system prompt`，就是后续真实发给模型的完整系统提示
- 与AI对话和与人对话都会记录用户输入开始、提交、`Backspace` 次数、反应时以及模型生成开始/结束时间
- 模型请求失败或超时会进入可重试状态，并在消息区显示错误

## 正式实验逻辑

- 正式实验只支持 `模式1` 和 `模式2`，不提供 `模式3`
- 每次实验覆盖全部 6 个启动语句
- 实验开始时会用时间戳种子打乱 prompt 顺序，并避免连续两次实验首题相同
- 起手方计划固定为 3 个 `user` 先说、3 个 `assistant` 先说，再随机打乱
- 实验中每题达到最大回合数后自动完成，并显示“本题完成，3秒钟后进入下一题”
- 6 题完成后自动导出一次实验级 JSON，并显示追踪问卷链接

## 环境变量

复制 `.env.example` 为 `.env`，填入以下内容：

```bash
VITE_LLM_BASE_URL=https://api.openai.com/v1
VITE_LLM_API_KEY=your_api_key_here
VITE_LLM_MODEL=deepseek-v4-flash
```

环境变量是默认远端配置。
如果用户在设置抽屉里填写了完整的 `base URL`、`API key` 和 `model`，运行时会优先使用用户配置，并保存在浏览器 `localStorage` 的 `cocreation.runtime_llm_config`。
设置抽屉里的普通设置会保存在浏览器 `localStorage` 的 `cocreation.story_settings`，刷新页面后继续使用。
如果用户配置不完整，会忽略用户配置并回退到环境变量。
如果用户配置和环境变量都不完整，应用会使用本地 mock provider，方便先跑通 UI 和交互。
`base URL` 和 `API key` 不会进入导出 JSON。

Provider 优先级：

1. 设置抽屉里的完整自定义配置
2. `.env` 中的 `VITE_LLM_BASE_URL`、`VITE_LLM_API_KEY`、`VITE_LLM_MODEL`
3. 本地 `MockProvider`

## 导出

- 当前只导出一个文件：`cocreation-yymmdd-hhmmss.json`
- JSON 顶层包含会话元信息、规则、seed、模型参数和完整对话
- `conversation[0]` 固定为开场句，格式为 `role: "user"` 且 `is_opening: true`
- 正式实验完成后导出实验级 JSON，`sessions` 中保存每一题的完整单题导出
- 字段命名统一使用 snake_case；`rules` 和 `seed` 内部保留当前前端对象字段
- 详细字段见 [docs/export-schema.md](/Users/eric/projects/cocreation-ui/docs/export-schema.md)

## 启动

```bash
npm install
npm run dev
```

## 检查

```bash
npm test -- --run
npm run build
npm run lint
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
  shared/lib/export/      JSON 导出逻辑
docs/
  product-design.md       产品规则与交互基线
  export-schema.md        JSON 导出字段说明
```
