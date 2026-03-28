import type {
  StoryRules,
  StorySeed,
  StoryStyle,
} from '../../entities/story-session/types'

export type StoryMode = 'manual' | 'auto'

export const defaultStoryStyle: StoryStyle = 'creative'
export const defaultStoryMode: StoryMode = 'manual'
export const defaultAutoTurnCount = 1
export const autoTurnCountRange = {
  min: 1,
  max: 10,
}

export const storyModeOptions: Array<{
  value: StoryMode
  label: string
  description: string
}> = [
  {
    value: 'manual',
    label: '人机对话',
    description: '保持当前模式，由你输入，AI 续写。',
  },
  {
    value: 'auto',
    label: '机器自动对话',
    description: '自动生成一组用户与 AI 的示例对话，用来测试 prompt 和启动语句。',
  },
]

export const defaultStoryRules: StoryRules = {
  maxChars: 20,
  punctuationAllowed: false,
}

export const storySeeds: StorySeed[] = [
  {
    id: 'library',
    title: '图书馆角落',
    openingLine: '图书馆的角落里有个读书的人',
    summary: '从安静、克制的空间里慢慢长出异样。',
  },
  {
    id: 'coffee',
    title: '苦涩牛奶',
    openingLine: '咖啡是苦涩的牛奶',
    summary: '让熟悉的事物从一开始就带着错位感。',
  },
  {
    id: 'grape',
    title: '葡萄太阳',
    openingLine: '公园里有一颗葡萄想要变成太阳',
    summary: '适合往童话、荒诞或寓言方向延伸。',
  },
  {
    id: 'ai-human',
    title: '成为人类',
    openingLine: '有一个人工智能想要成为人类',
    summary: '适合展开身份、情感和选择的冲突。',
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
