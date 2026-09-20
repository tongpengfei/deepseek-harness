/** Persistent progress for the shared programming-course flow. */

import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'

/** Browser-local learning state for one course catalog. */
export interface CourseProgressState {
  activeLessonId: string
  completedLessonIds: string[]
  answers: Record<string, number>
}

type CourseProgressActions = {
  selectLesson: (draft: CourseProgressState, lessonId: string) => void
  answer: (draft: CourseProgressState, lessonId: string, option: number, correct: boolean) => void
  reset: (draft: CourseProgressState, firstLessonId: string) => void
}

/**
 * Declare browser-local course progress that survives App remounts and page refreshes.
 * @param firstLessonId - initial lesson for a learner without saved progress.
 * @returns a root-scoped persistent store handle owned by the App registration.
 */
export function createCourseProgressStore(firstLessonId: string): EngineStoreHandle<CourseProgressState, CourseProgressActions> {
  return defineStore({
    init: (): CourseProgressState => ({
      activeLessonId: firstLessonId,
      completedLessonIds: [],
      answers: {},
    }),
    persist: 'dsh.app.code-learning.v1',
    actions: {
      selectLesson: (draft, lessonId) => { draft.activeLessonId = lessonId },
      answer: (draft, lessonId, option, correct) => {
        draft.answers[lessonId] = option
        if (correct && !draft.completedLessonIds.includes(lessonId)) draft.completedLessonIds.push(lessonId)
      },
      reset: (draft, firstLessonId) => {
        draft.activeLessonId = firstLessonId
        draft.completedLessonIds = []
        draft.answers = {}
      },
    },
  })
}
