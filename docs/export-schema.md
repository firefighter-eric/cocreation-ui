# 导出 JSON 字段文档

当前版本只导出一个文件：

- `cocreation-yymmdd-hhmmss.json`

文件名时间戳使用用户本地时间，格式为 `yymmdd-hhmmss`。

## 顶层结构

```json
{
  "session_id": "string",
  "session_started_at": "string | null",
  "system_prompt": "string",
  "model_settings": {
    "model": "gpt-4.1-mini",
    "temperature": 1.0,
    "top_p": 1.0
  },
  "max_round_count": 5,
  "exported_at": "string",
  "mode": "manual | human_like | auto",
  "style": "creative | coherent",
  "status": "idle | ready | submitting_user_line | waiting_for_ai | ai_replied | failed",
  "error": "string | null",
  "rules": {
    "maxChars": 20,
    "allowPunctuation": false
  },
  "seed": {
    "id": "string",
    "title": "string",
    "openingLine": "string",
    "summary": "string"
  },
  "conversation": []
}
```

说明：

- 顶层字段全部使用 snake_case，只有 `rules` 和 `seed` 内部仍保留当前前端对象结构
- `system_prompt` 是导出时当前生效的完整系统提示
- `model_settings` 记录请求参数中的当前模型设置
- `model_settings.model` 记录本次请求使用的模型名
- `max_round_count` 记录当前会话允许的最大回合数
- `mode` 反映当前产品模式，不隐藏 `human_like` 的真实模式值

## conversation 数组

`conversation` 按显示顺序保存开场句和后续消息。

### 第一项：开场句

第一项固定由 seed 的开场句生成：

```json
{
  "role": "user",
  "content": "图书馆的角落里有个读书的人",
  "is_opening": true
}
```

说明：

- 开场句不是 `system`，也不是自定义的 `opening`
- 它与真实请求组织保持一致，作为第一条 `user` message

### 后续普通消息

后续消息格式如下：

```json
{
  "id": "string",
  "role": "user | assistant",
  "content": "string",
  "created_at": "string",
  "is_opening": false,
  "interaction": null
}
```

## interaction 字段

`interaction` 用于保留手动模式中的行为记录。
如果该条消息没有额外交互记录，值为 `null`。

### 用户消息

用户消息可能包含：

```json
{
  "input_started_at": "string | undefined",
  "input_ended_at": "string | undefined",
  "backspace_count": 3,
  "reaction_reference_at": "string | undefined",
  "reaction_time_ms": 1280
}
```

字段说明：

- `input_started_at`：该轮第一次开始输入的时间
- `input_ended_at`：该轮按回车提交的时间
- `backspace_count`：该轮输入阶段按下 `Backspace` 的次数
- `reaction_reference_at`：本轮反应时的起点时间
- `reaction_time_ms`：从反应起点到开始输入的毫秒数

反应时规则：

- 第一轮用户输入：从 `session_started_at` 计算到 `input_started_at`
- 后续用户输入：从上一条 AI 消息的 `ai_ended_at` 计算到 `input_started_at`

### 助手消息

助手消息可能包含：

```json
{
  "ai_started_at": "string | undefined",
  "ai_ended_at": "string | undefined"
}
```

字段说明：

- `ai_started_at`：发起本轮模型生成的时间
- `ai_ended_at`：收到本轮完整回复的时间

## 与请求格式的关系

当前请求给模型的 `messages` 组织方式为：

```json
[
  {
    "role": "system",
    "content": "当前完整 system prompt"
  },
  {
    "role": "user",
    "content": "开场句"
  },
  {
    "role": "user",
    "content": "用户第一句输入"
  },
  {
    "role": "assistant",
    "content": "模型第一句回复"
  }
]
```

因此导出中的开场句也使用：

- `role = "user"`
- `is_opening = true`

## 修改规则

如果后续修改导出结构：

- 先更新 [产品设计文档](/Users/eric/projects/cocreation-ui/docs/product-design.md)
- 再更新本文件
- 最后同步测试与实现
