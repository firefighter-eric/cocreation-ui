# 导出 JSON 字段文档

当前版本只导出一个文件：

- `cocreation-yymmdd-hhmmss.json`

文件名时间戳使用用户本地时间，格式为 `yymmdd-hhmmss`。

当前存在两种导出粒度：

- playground 单题导出
- 正式实验整次导出

## 顶层结构

```json
{
  "session_id": "string",
  "session_started_at": "string | null",
  "system_prompt": "string",
  "model_settings": {
    "model": "deepseek-v4-pro",
    "temperature": 1.5,
    "top_p": 1.0
  },
  "human_like_settings": {
    "delay_multiplier": 2
  },
  "max_round_count": 5,
  "starting_round_mode": "user | assistant | random",
  "starting_round_speaker": "user | assistant | null",
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
- `human_like_settings.delay_multiplier` 记录“与人对话”前台延迟展示使用的倍率
- `max_round_count` 记录当前会话允许的最大回合数
- `starting_round_mode` 记录当前会话采用的开始回合策略；playground 中来自设置选择，正式实验中为实验计划锁定后的值
- `starting_round_speaker` 记录本次会话实际的起手方；如果会话尚未开始则为 `null`
- `mode` 反映当前产品模式，不隐藏 `human_like` 的真实模式值

## conversation 数组

`conversation` 按显示顺序保存开场句和后续消息。

### 第一项：开场句

第一项固定由 seed 的开场句生成：

```json
{
  "role": "user",
  "content": "一辆出租车停在路边",
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

- 第一轮用户输入：从故事开场句实际显示时间计算到 `input_started_at`
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

## 正式实验导出

正式实验完成后，导出为单个实验级 JSON：

```json
{
  "experiment_id": "string",
  "experiment_started_at": "string",
  "experiment_completed_at": "string | null",
  "experiment_mode": "manual | human_like",
  "prompt_count": 6,
  "exported_at": "string",
  "sessions": []
}
```

说明：

- `experiment_mode` 是本次正式实验开始时选择的模式
- `prompt_count` 固定为当前实验中包含的 prompt 数量
- `sessions` 按实验实际推进顺序保存每一题的完整单题导出

### sessions 数组

`sessions` 中每一项都包含一个单题会话的完整导出结构，并额外补充实验维度字段：

```json
{
  "prompt_index": 1,
  "session_id": "string",
  "session_started_at": "string | null",
  "system_prompt": "string",
  "model_settings": {
    "model": "deepseek-v4-pro",
    "temperature": 1.5,
    "top_p": 1.0
  },
  "human_like_settings": {
    "delay_multiplier": 2
  },
  "max_round_count": 5,
  "starting_round_mode": "user | assistant",
  "starting_round_speaker": "user | assistant",
  "mode": "manual | human_like",
  "style": "creative | coherent",
  "status": "string",
  "error": "string | null",
  "rules": {},
  "seed": {},
  "conversation": []
}
```

说明：

- `prompt_index` 表示该题在本次正式实验中的顺序，从 `1` 开始
- `seed` 保留该题对应的开场句信息
- `starting_round_mode` 在正式实验中不来自设置抽屉，而是直接等于该题已锁定的起手方
- `starting_round_speaker` 记录该题实际安排的起手方
- `conversation` 继续保留开场句和该题全部消息明细
