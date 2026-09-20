// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createCourseProgressStore } from '../src/client/progress-store.ts'

beforeEach(() => { localStorage.clear() })

describe('course progress store', () => {
  it('records mastered lessons and resets navigation without deleting the Session', () => {
    const instance = createCourseProgressStore('hello').create()
    instance.actions.completeLesson('hello')
    instance.actions.completeLesson('hello')
    instance.actions.selectLesson('values')
    instance.actions.setTutorSession('tutor-session')
    expect(instance.getSnapshot()).toEqual({
      activeLessonId: 'values',
      completedLessonIds: ['hello'],
      tutorSessionId: 'tutor-session',
    })

    instance.actions.reset('hello')
    expect(instance.getSnapshot()).toEqual({
      activeLessonId: 'hello',
      completedLessonIds: [],
    })
  })

  it('rehydrates the Tutor Session identity and progress from browser storage', () => {
    const first = createCourseProgressStore('hello').create()
    first.actions.completeLesson('hello')
    first.actions.selectLesson('values')
    first.actions.setTutorSession('persisted-session')

    const restored = createCourseProgressStore('hello').create()
    expect(restored.getSnapshot()).toEqual({
      activeLessonId: 'values',
      completedLessonIds: ['hello'],
      tutorSessionId: 'persisted-session',
    })
  })
})
