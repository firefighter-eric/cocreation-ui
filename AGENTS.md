# AGENTS.md

本文件是 `cocreation-ui` 仓库的协作说明，供后续 agent 或开发者在修改项目时直接遵循。

## 1. 先看什么

开始改动前，优先阅读：

1. [docs/product-design.md](/Users/eric/projects/cocreation-ui/docs/product-design.md)
2. [README.md](/Users/eric/projects/cocreation-ui/README.md)

如果用户需求和当前代码不一致，默认先更新产品文档，再改实现。
不要只根据当前 UI 猜产品规则。

## 2. 项目目标

这是一个中文“共创故事”前端应用，不是通用聊天助手。
核心能力是：

- 启动语句驱动的故事接龙
- 与AI对话模式
- 与人对话模式
- AI自动对话模式
- JSON 导出

不要把产品演化成通用问答、文档助手、多人协作平台或复杂工作台，除非文档先变更。

## 3. 当前产品约束

当前产品基线以 [docs/product-design.md](/Users/eric/projects/cocreation-ui/docs/product-design.md) 为准，关键约束包括：

- 界面风格为白色、接近 ChatGPT 的双栏布局
- 左侧栏只放全局设置，不放自动模式专属控件
- 当前规则卡片放在右侧标题区右侧，不放在左侧栏
- 两个模式的导出入口位置必须一致，统一在右上角
- 右上角提供设置按钮，点击后从右侧弹出 prompt 设置抽屉
- 创作风格放在设置抽屉里，不放在左侧栏
- temperature、top_p 等模型参数放在设置抽屉里
- 设置抽屉中的文本就是最终完整 system prompt
- 风格切换会直接改写这份可见 prompt，而不是隐藏注入
- 与人对话模式前台必须使用“对方”语义，不显示 AI 身份
- 与人对话模式前台文案不得提示其为伪装、模拟或模型生成
- 消息头像文案保持直接称呼，与AI对话使用“我 / AI”，与人对话使用“我 / 对方”
- 手动模式必须先点击开始，再允许输入
- 手动模式支持回车发送，`Shift + Enter` 换行
- 中文输入法 composition 过程中，回车不能触发发送
- 模型请求不能无限挂起，超时后要恢复可重试状态
- 规则校验失败时不要做静默拦截，发送按钮应禁用且错误提示要显眼
- 自动模式轮数通过输入框设置，范围为 `1-10`
- 自动模式轮数输入应允许先清空再输入，避免受控 number 输入的糟糕体验
- 默认故事规则是 `20` 字内、禁止标点、禁止空输入
- 导出文件名为 `cocreation-yymmdd-hhmmss.json`
- 导出 JSON 字段统一使用 snake_case
- `human_like` 模式仍保留真实生成时间字段，不隐藏 `ai_*`
- 与AI对话模式必须记录：
  - session 开始时间
  - 用户输入开始时间
  - 用户提交时间
  - 用户每轮 `Backspace` 次数
  - 用户每轮反应时
  - AI 生成开始时间
  - AI 生成结束时间
- JSON 必须保留完整元信息和消息明细

如果要改这些规则，先更新产品文档，再改代码和测试。

## 4. 代码分层要求

保持现有分层，不要把逻辑重新塞回页面组件：

- `src/entities`：核心类型、状态机、纯逻辑
- `src/features`：功能 UI 和交互组织
- `src/shared/config`：默认配置和模式定义
- `src/shared/lib/llm`：provider、prompt、模型调用
- `src/shared/lib/validation`：输入输出规则
- `src/shared/lib/export`：导出逻辑
- `src/shared/lib/storage`：存储抽象
- `src/app`：应用装配、入口级测试

具体要求：

- React 组件不要直接拼 prompt
- React 组件不要直接 `fetch`
- 导出格式不要散落在组件里
- 新增模式或规则优先改配置、状态和纯逻辑层
- 用户填写的 system prompt 必须通过状态和 provider 接口传递，不要写死在组件里
- 用户修改的模型参数必须通过状态和 provider 接口传递，并进入导出 JSON
- 开场句放在请求中的第一条 user message，不放在 system prompt 里
- 导出里的开场句应与请求格式一致，使用 `role = user` 并额外标记 `is_opening = true`

## 5. 修改原则

做改动时遵循这些原则：

- 优先保留当前产品方向，不做随意扩写
- 小改动优先局部修改，不大面积重构
- 改产品行为时同步更新测试
- 改产品规则时同步更新 `docs/product-design.md`
- 改导出结构时同步更新 `docs/export-schema.md`
- 改环境变量或启动方式时同步更新 `README.md`

不要做这些事：

- 不要提交 `.env`
- 不要把真实 API key 写进源码
- 不要为了实现新功能绕过现有 provider 抽象
- 不要把自动模式特有控件塞回左侧栏

## 6. 导出相关规则

导出行为是当前产品的重要接口，修改时必须谨慎。

当前导出规范：

- 一次导出只下载 JSON
- 文件名使用本地时间戳
- JSON 用于保留完整上下文和程序消费
- 导出字段说明以 `docs/export-schema.md` 为准

除非产品文档明确变更，否则不要：

- 删除 JSON 中的会话元信息
- 擅自改动 snake_case 字段命名

## 7. 测试与验证

完成改动后，至少运行：

```bash
npm test -- --run
npm run build
npm run lint
```

如果只改文档，仍建议至少保证仓库说明没有和代码现状冲突。

## 8. 提交前检查

提交前确认：

- `.env` 未被跟踪
- 文档和实现一致
- 测试通过
- 没有把临时调试代码留在仓库里

如果新增产品能力，优先补这三类内容：

- 产品文档
- 行为测试
- 用户可见的错误处理
