import type {
  StartingRoundMode,
  StoryRules,
  StorySeed,
  StoryStyle,
} from '../../entities/story-session/types'

export type StoryMode = 'manual' | 'human_like' | 'auto'

export const defaultStoryStyle: StoryStyle = 'creative'
export const defaultStoryMode: StoryMode = 'manual'
export const defaultMaxRoundCount = 5
export const defaultStartingRoundMode: StartingRoundMode = 'random'
export const defaultHumanLikeDelayMultiplier = 2
export const humanLikeDelayMultiplierRange = {
  min: 0.5,
  max: 5,
}
export const roundCountRange = {
  min: 1,
  max: 10,
}
export const startingRoundOptions: Array<{
  value: StartingRoundMode
  label: string
  description: string
}> = [
  {
    value: 'user',
    label: '用户',
    description: '由你先接上开场句。',
  },
  {
    value: 'assistant',
    label: '对方',
    description: '点击开始后先由对方说第一句。',
  },
  {
    value: 'random',
    label: '随机',
    description: '每次新会话随机决定谁先开始。',
  },
]

export const storyModeOptions: Array<{
  value: StoryMode
  label: string
  description: string
}> = [
  {
    value: 'manual',
    label: '与AI对话',
    description: '由你输入，AI 接着续写。',
  },
  {
    value: 'human_like',
    label: '与人对话',
    description: '与对话搭档轮流接龙。',
  },
  {
    value: 'auto',
    label: 'AI自动对话',
    description: '自动生成一组示例对话。',
  },
]

export const defaultStoryRules: StoryRules = {
  maxChars: 20,
  punctuationAllowed: false,
}

export const storySeeds: StorySeed[] = [
  {
    id: 'taxi',
    title: '路边出租车',
    openingLine: '一辆出租车停在路边',
    summary: '从街头短暂停顿的瞬间，往未知去向慢慢展开。',
  },
  {
    id: 'hallway-light',
    title: '走廊感应灯',
    openingLine: '走廊尽头的感应灯亮了起来',
    summary: '适合从安静空间里的细小变化开始推进。',
  },
  {
    id: 'traffic-light',
    title: '路口红绿灯',
    openingLine: '我在路边等红绿灯',
    summary: '从常见城市时刻切入，容易长出人物关系和事件。',
  },
  {
    id: 'email',
    title: '今天的邮件',
    openingLine: '今天我收到了一封电子邮件',
    summary: '让故事从一条信息开始，逐步揭开后续变化。',
  },
  {
    id: 'clock',
    title: '挂钟敲响',
    openingLine: '墙上的挂钟刚刚敲响',
    summary: '适合围绕时间节点、等待和转折继续推进。',
  },
  {
    id: 'tv',
    title: '电视闪烁',
    openingLine: '电视屏幕突然闪烁了一下',
    summary: '从日常物件的异常反应切入，制造悬念或错位感。',
  },
]

export const styleOptions: Array<{
  value: StoryStyle
  label: string
  description: string
}> = [
  {
    value: 'creative',
    label: '脑洞跳脱',
    description: '让情节更意外，转折更大胆。',
  },
  {
    value: 'coherent',
    label: '自然连贯',
    description: '保持逻辑顺滑，像共同写一个完整故事。',
  },
]

export function getStyleSystemPrompt(style: StoryStyle) {
  return style === 'creative'
    ? '请给出一句意想不到但仍能自然延续上文的短句。'
    : '请给出一句自然连贯、符合日常叙事逻辑的短句。'
}
