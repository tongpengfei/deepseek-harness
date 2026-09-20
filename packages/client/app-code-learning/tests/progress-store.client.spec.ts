// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createCourseProgressStore } from '../src/client/progress-store.ts'

beforeEach(() => { localStorage.clear() })

describe('course progress store', () => {
  it('records correct answers once and resets the course', () => {
    const instance = createCourseProgressStore('hello').create()
    instance.actions.answer('hello', 1, true)
    instance.actions.answer('hello', 1, true)
    expect(instance.getSnapshot()).toEqual({
      activeLessonId: 'hello',
      completedLessonIds: ['hello'],
      answers: { hello: 1 },
    })

    instance.actions.selectLesson('values')
    instance.actions.answer('values', 2, false)
    expect(instance.getSnapshot()).toMatchObject({
      activeLessonId: 'values',
      completedLessonIds: ['hello'],
      answers: { hello: 1, values: 2 },
    })

    instance.actions.reset('hello')
    expect(instance.getSnapshot()).toEqual({
      activeLessonId: 'hello',
      completedLessonIds: [],
      answers: {},
    })
  })

  it('rehydrates progress from browser storage', () => {
    const first = createCourseProgressStore('hello').create()
    first.actions.answer('hello', 1, true)
    first.actions.selectLesson('values')

    const restored = createCourseProgressStore('hello').create()
    expect(restored.getSnapshot()).toEqual({
      activeLessonId: 'values',
      completedLessonIds: ['hello'],
      answers: { hello: 1 },
    })
  })
})
