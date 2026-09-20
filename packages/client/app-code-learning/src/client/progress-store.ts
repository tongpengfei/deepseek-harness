/** Persistent navigation and Session identity for the conversational Tutor. */

import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-store'

/** Browser-local learning state; conversation messages remain in the DSH Session log. */
export interface CourseProgressState {
  activeLessonId: string
  completedLessonIds: string[]
  tutorSessionId?: string
}

type CourseProgressActions = {
  selectLesson: (draft: CourseProgressState, lessonId: string) => void
  completeLesson: (draft: CourseProgressState, lessonId: string) => void
  setTutorSession: (draft: CourseProgressState, sessionId: string) => void
  reset: (draft: CourseProgressState, firstLessonId: string) => void
}

/**
 * Declare browser-local Tutor navigation that survives App remounts and page refreshes.
 * @param firstLessonId - initial lesson for a learner without saved progress.
 * @returns a root-scoped persistent store handle owned by the App registration.
 */
export function createCourseProgressStore(firstLessonId: string): EngineStoreHandle<CourseProgressState, CourseProgressActions> {
  return defineStore({
    init: (): CourseProgressState => ({
      activeLessonId: firstLessonId,
      completedLessonIds: [],
    }),
    persist: 'dsh.app.code-learning.v2',
    actions: {
      selectLesson: (draft, lessonId) => { draft.activeLessonId = lessonId },
      completeLesson: (draft, lessonId) => {
        if (!draft.completedLessonIds.includes(lessonId)) draft.completedLessonIds.push(lessonId)
      },
      setTutorSession: (draft, sessionId) => { draft.tutorSessionId = sessionId },
      reset: (draft, firstLessonId) => {
        draft.activeLessonId = firstLessonId
        draft.completedLessonIds = []
        delete draft.tutorSessionId
      },
    },
  })
}
