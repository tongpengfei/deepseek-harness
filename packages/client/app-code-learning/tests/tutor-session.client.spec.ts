import { describe, expect, it } from 'vitest'
import type { SessionEventLikeEntry } from '@deepseek-ai/dsh-api-session-controller/client'
import { cCourse } from '../src/client/c-course.ts'
import { en, type CourseLocaleKey } from '../src/client/locales.ts'
import {
  projectTutorMessages, TUTOR_CONTROL_PREFIX, tutorBootstrapPrompt, tutorLessonPrompt,
} from '../src/client/tutor-session.ts'

const t = (key: CourseLocaleKey): string => en[key]

describe('Tutor Session adapter', () => {
  it('grounds initial and switched lessons without claiming code execution', () => {
    const initial = tutorBootstrapPrompt(cCourse, cCourse.lessons[0], t)
    expect(initial).toContain(TUTOR_CONTROL_PREFIX)
    expect(initial).toContain('Programs begin at main')
    expect(initial).toContain('```c\n#include <stdio.h>')
    expect(initial).toContain('Never claim that code was compiled or executed')

    const switched = tutorLessonPrompt(cCourse, cCourse.lessons[5]!, t)
    expect(switched).toContain('Pointers and addresses')
    expect(switched).toContain('int *pointer = &value;')
    expect(switched).toContain('same tutor')
  })

  it('hides control messages and projects durable plus streaming conversation text', () => {
    const entries = [
      { type: 'event', event: { type: 'user/message', seq: 1, time: 1, data: {
        content: [{ type: 'text', text: `${TUTOR_CONTROL_PREFIX}\nsetup` }], source: { kind: 'user' },
      } } },
      { type: 'event', event: { type: 'assistant/message', seq: 2, time: 2, data: {
        turn: 1, step: 1, stream: [], message: {
          id: 'assistant', role: 'assistant', source: { kind: 'model', provider: 'mock', model: 'mock' },
          content: [{ type: 'text', text: '先认识 main。' }],
        },
      } } },
      { type: 'event', event: { type: 'assistant/message', seq: 2.5, time: 2, data: {
        turn: 1, step: 2, stream: [], message: {
          id: 'empty', role: 'assistant', source: { kind: 'model', provider: 'mock', model: 'mock' },
          content: [{ type: 'reasoning', text: 'not presented' }],
        },
      } } },
      { type: 'event', event: { type: 'user/message', seq: 3, time: 3, data: {
        content: [{ type: 'text', text: 'main 为什么返回 int？' }], source: { kind: 'user' },
      } } },
      { type: 'transient', event: { type: 'assistant/live-chunk', seq: 4, time: 4, data: {
        attemptId: 'attempt', turn: 2, step: 1, chunk: { type: 'text-delta', index: 0, text: '它把' },
      } } },
      { type: 'transient', event: { type: 'assistant/live-chunk', seq: 5, time: 5, data: {
        attemptId: 'attempt', turn: 2, step: 1, chunk: { type: 'reasoning-delta', index: 1, text: 'hidden' },
      } } },
      { type: 'transient', event: { type: 'assistant/live-chunk', seq: 6, time: 6, data: {
        attemptId: 'attempt', turn: 2, step: 1, chunk: { type: 'text-delta', index: 0, text: '状态交给环境。' },
      } } },
      { type: 'event', event: { type: 'turn/end', seq: 7, time: 7, data: {
        turn: 2, step: 1, reason: { kind: 'completed' },
      } } },
    ] as unknown as SessionEventLikeEntry[]

    expect(projectTutorMessages(entries)).toEqual([
      { key: 'assistant:2', role: 'tutor', text: '先认识 main。', seq: 2, streaming: false },
      { key: 'user:3', role: 'learner', text: 'main 为什么返回 int？', seq: 3, streaming: false },
      { key: 'live:attempt', role: 'tutor', text: '它把状态交给环境。', seq: 4, streaming: true },
    ])
  })
})
