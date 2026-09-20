// @vitest-environment jsdom
import { useSyncExternalStore } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CodeLearningApp, type CodeLearningAppProps } from '../src/client/CodeLearningApp.tsx'
import { createCourseProgressStore } from '../src/client/progress-store.ts'
import { en, type CourseLocaleKey } from '../src/client/locales.ts'

beforeEach(() => { localStorage.clear() })
afterEach(cleanup)

function props(view: 'summary' | 'page'): CodeLearningAppProps {
  const instance = createCourseProgressStore('hello').create()
  const translate = (key: CourseLocaleKey, params?: Record<string, unknown>) => {
    let value: string = en[key]
    for (const [name, replacement] of Object.entries(params ?? {})) {
      value = value.replace(`{${name}}`, String(replacement))
    }
    return value
  }
  const readStore = <T, >(selector: (state: ReturnType<typeof instance.getSnapshot>) => T): T =>
    selector(useSyncExternalStore(
      listener => instance.subscribe(listener),
      () => instance.getSnapshot(),
    ))
  return {
    view,
    close: () => {},
    t: translate,
    useStore: readStore,
    actions: instance.actions,
  } as unknown as CodeLearningAppProps
}

describe('CodeLearningApp', () => {
  it('renders concise catalog content', () => {
    render(<CodeLearningApp {...props('summary')} />)
    expect(screen.getByText(/Build C fundamentals/)).toBeTruthy()
    expect(screen.getByText('6 core lessons')).toBeTruthy()
  })

  it('teaches a lesson, reports mistakes, and advances after the correct answer', () => {
    render(<CodeLearningApp {...props('page')} />)
    expect(screen.getByRole('heading', { name: 'Programs begin at main' })).toBeTruthy()
    expect(screen.getByText(/printf\("Hello, C!/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /return 0/ }))
    expect(screen.getByRole('status').textContent).toContain('Try again')
    expect(screen.getByRole('button', { name: 'Next lesson' }).hasAttribute('disabled')).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /#include <stdio.h>/ }))
    expect(screen.getByRole('status').textContent).toContain('Correct')
    const next = screen.getByRole('button', { name: 'Next lesson' })
    expect(next.hasAttribute('disabled')).toBe(false)
    fireEvent.click(next)
    expect(screen.getByRole('heading', { name: 'Variables and basic types' })).toBeTruthy()
    expect(screen.getByLabelText('1/6 complete')).toBeTruthy()
  })

  it('opens lessons from the shared outline and resets progress', () => {
    render(<CodeLearningApp {...props('page')} />)
    fireEvent.click(screen.getByRole('button', { name: /Pointers and addresses/ }))
    expect(screen.getByRole('heading', { name: 'Pointers and addresses' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Previous lesson' }))
    expect(screen.getByRole('heading', { name: 'Arrays hold a sequence' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }))
    expect(screen.getByRole('heading', { name: 'Programs begin at main' })).toBeTruthy()
  })

  it('returns invalid persisted navigation to the first lesson', () => {
    localStorage.setItem('dsh.app.code-learning.v1', JSON.stringify({
      activeLessonId: 'removed-lesson',
      completedLessonIds: [],
      answers: {},
    }))
    render(<CodeLearningApp {...props('page')} />)
    expect(screen.getByRole('heading', { name: 'Programs begin at main' })).toBeTruthy()
  })
})
