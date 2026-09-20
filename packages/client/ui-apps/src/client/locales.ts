/** Apps catalog copy. */

/** Simplified Chinese dictionary and locale-key source of truth. */
export const zh = {
  panel: '应用',
  title: '应用',
  intro: '使用针对具体场景设计的 AI 工具',
  catalog: '应用列表',
  emptyTitle: '还没有应用',
  emptyDescription: '启用提供应用的插件后，它们会显示在这里。',
  back: '返回应用列表',
} satisfies Record<string, string>

/** Apps dictionary key union. */
export type AppsLocaleKey = keyof typeof zh

/** English dictionary checked against the Chinese key set. */
export const en = {
  panel: 'Apps',
  title: 'Apps',
  intro: 'Use AI tools designed for specific tasks',
  catalog: 'App catalog',
  emptyTitle: 'No Apps yet',
  emptyDescription: 'Apps appear here when you enable a plugin that provides one.',
  back: 'Back to Apps',
} satisfies Record<AppsLocaleKey, string>
