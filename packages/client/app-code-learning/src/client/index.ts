/** Browser registration for the C course in the shared Apps catalog. */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-apps/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { CodeLearningApp } from './CodeLearningApp.tsx'
import { cCourse } from './c-course.ts'
import { createCourseProgressStore } from './progress-store.ts'
import { en, zh, type CourseLocaleKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Programming-course copy. */
    'codeLearning': CourseLocaleKey
  }
}

/** Browser services used by the course App. */
export const inject = ['slots', 'locale']

/**
 * Register the C course and its persistent learning state in the Apps catalog.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register('codeLearning', { zh, en }), 'app-code-learning: dictionaries')
  const progress = createCourseProgressStore(cCourse.lessons[0].id)
  ctx.slots.inject('apps.item', () => ctx.slots.register({
    name: 'apps.item',
    id: 'learn-c',
    order: 10,
    label: () => ctx.locale.bind('codeLearning')('app.name'),
    locale: 'codeLearning',
    store: progress,
  }, CodeLearningApp))
}
