// @vitest-environment jsdom
import { useSyncExternalStore } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MutableSessionEventSource,
  type ISessions, type SessionBinding, type SessionFace, type SessionSnapshot,
} from '@deepseek-ai/dsh-api-session-controller/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { CodeLearningApp, type CodeLearningAppProps } from '../src/client/CodeLearningApp.tsx'
import { createCourseProgressStore } from '../src/client/progress-store.ts'
import { en, type CourseLocaleKey } from '../src/client/locales.ts'

beforeEach(() => { localStorage.clear() })
afterEach(() => {
  cleanup()
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
})

function tutorHarness(options: {
  createFailure?: Error | string
  promptFailure?: Error | string
  promptRemoteError?: boolean
  renameError?: boolean
  ready?: Promise<SessionBinding>
} = {}) {
  const sessionId = 'tutor-session' as SessionId
  const state = createSnapshotStore<SessionSnapshot>({
    sessionId,
    pendingSubmissions: [],
    running: false,
    subagent: null,
    removed: false,
    openState: 'open',
    openError: null,
    hasMore: false,
    loadingOlder: false,
    promptError: null,
    blank: true,
    lastAgentError: null,
    promptAttempted: false,
    awaitingFirstTurn: false,
  })
  const events = new MutableSessionEventSource()
  const promptCall = vi.fn<SessionFace['prompt']>(async () => {
    if (options.promptFailure !== undefined) throw options.promptFailure
    if (options.promptRemoteError === true) {
      return { ok: false as const, error: { code: 'PROMPT', message: 'prompt refused' } } as never
    }
    return { ok: true as const, value: { accepted: true as const } }
  })
  const rename = vi.fn(async () => options.renameError === true
    ? { ok: false as const, error: { code: 'RENAME', message: 'rename refused' } }
    : { ok: true as const, value: { title: 'Learn C', seq: 1 } })
  const cancel = vi.fn(async () => ({ ok: true as const, value: { accepted: true as const } }))
  const session = Object.assign(state, {
    sessionId,
    projections: { faceOf: () => createSnapshotStore(undefined) },
    beginSubmission: vi.fn(),
    prompt: promptCall,
    readAttachment: vi.fn(),
    updateQueue: vi.fn(),
    cancel,
    rename,
    loadOlder: vi.fn(),
    loadThrough: vi.fn(),
    command: vi.fn(),
  }) as unknown as SessionFace
  const binding = { sessionId, session, eventSource: events, ctx: {} } as unknown as SessionBinding
  const release = vi.fn()
  const reference: ReturnType<ISessions['retain']> = {
    sessionId, binding, ready: options.ready ?? Promise.resolve(binding), release,
  } as never
  const create = vi.fn<ISessions['create']>(async () => {
    if (options.createFailure !== undefined) throw options.createFailure
    return sessionId
  })
  const retain = vi.fn<ISessions['retain']>(() => reference)
  const using: ISessions['using'] = async (_target, _options, operation) => await operation(reference)
  const sessions = {
    create,
    retain,
    using,
  } as unknown as ISessions
  return { binding, cancel, create, events, promptCall, release, rename, retain, sessions, state }
}

function props(
  view: 'summary' | 'page',
  sessions: ISessions,
  replacements: Partial<Record<CourseLocaleKey, string>> = {},
): CodeLearningAppProps {
  const instance = createCourseProgressStore('hello').create()
  const translate = (key: CourseLocaleKey, params?: Record<string, unknown>) => {
    let value: string = replacements[key] ?? en[key]
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
    sessions,
  } as unknown as CodeLearningAppProps
}

function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason: unknown) => void
} {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function promptText(call: Parameters<SessionFace['prompt']> | undefined): string {
  const content = call?.[0][0]
  return content?.type === 'text' ? content.text : ''
}

function assistantEntry(text: string) {
  return { type: 'event', event: { type: 'assistant/message', seq: 2, time: 2, data: {
    turn: 1, step: 1, stream: [], message: {
      id: 'assistant', role: 'assistant', source: { kind: 'model', provider: 'mock', model: 'mock' },
      content: [{ type: 'text', text }],
    },
  } } } as const
}

describe('CodeLearningApp', () => {
  it('renders concise conversational catalog content', () => {
    const harness = tutorHarness()
    render(<CodeLearningApp {...props('summary', harness.sessions)} />)
    expect(screen.getByText(/AI Tutor/)).toBeTruthy()
    expect(screen.getByText('22 micro-lessons')).toBeTruthy()
  })

  it('creates a durable Tutor Session and renders its Markdown code', async () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
    const harness = tutorHarness()
    render(<CodeLearningApp {...props('page', harness.sessions)} />)
    expect(screen.getByRole('heading', { name: 'Start with your AI Tutor' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Start lesson one' }))

    await waitFor(() => { expect(harness.create).toHaveBeenCalledOnce() })
    expect(harness.create).toHaveBeenCalledWith({ agentPreset: 'learning' })
    await waitFor(() => { expect(harness.promptCall).toHaveBeenCalledOnce() })
    expect(harness.rename).toHaveBeenCalledWith('Learn C')
    expect(promptText(harness.promptCall.mock.calls[0])).toContain('Programs begin at main')

    harness.events.replace([assistantEntry('Try this:\n\n```c\nprintf("Hello");\n```')] as never, false)
    expect(await screen.findByText('Try this:')).toBeTruthy()
    expect(screen.getByText((_content, element) =>
      element?.tagName === 'CODE' && element.textContent === 'printf("Hello");')).toBeTruthy()
    expect(document.querySelector('[data-line-numbers]')).not.toBeNull()
    expect(document.querySelectorAll('code > .line')).toHaveLength(1)
  })

  it('switches the outline before a Session exists and restores invalid navigation', () => {
    localStorage.setItem('dsh.app.code-learning.v2', JSON.stringify({
      activeLessonId: 'removed-lesson', completedLessonIds: [],
    }))
    const harness = tutorHarness()
    render(<CodeLearningApp {...props('page', harness.sessions)} />)
    expect(screen.getByRole('heading', { name: 'Programs begin at main' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Include stdio.h/ }))
    expect(screen.getByRole('heading', { name: 'Include stdio.h' })).toBeTruthy()
    expect(harness.promptCall).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Include stdio.h/ }))
    expect(harness.promptCall).not.toHaveBeenCalled()
  })

  it('resizes, collapses, and restores the course outline', () => {
    const harness = tutorHarness()
    const view = render(<CodeLearningApp {...props('page', harness.sessions)} />)
    const root = view.container.querySelector<HTMLElement>('[data-code-learning-app]')!
    Object.defineProperty(root, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ width: 1000 }) as DOMRect,
    })
    const separator = screen.getByRole('separator', { name: 'Resize course outline' })

    fireEvent.pointerDown(separator, { button: 0, clientX: 270, pointerId: 7 })
    fireEvent.pointerMove(window, { clientX: 370, pointerId: 7 })
    expect(separator.getAttribute('aria-valuenow')).toBe('370')
    fireEvent.pointerUp(window, { pointerId: 7 })

    fireEvent.keyDown(separator, { key: 'ArrowRight' })
    expect(separator.getAttribute('aria-valuenow')).toBe('386')
    expect(JSON.parse(localStorage.getItem('dsh.app.code-learning.layout.v1') ?? '{}')).toMatchObject({
      sidebarWidth: 386,
      collapsed: false,
    })

    fireEvent.click(screen.getByRole('button', { name: 'Hide course outline' }))
    expect(screen.getByRole('button', { name: 'Show course outline' })).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('dsh.app.code-learning.layout.v1') ?? '{}')).toMatchObject({
      sidebarWidth: 386,
      collapsed: true,
    })

    cleanup()
    render(<CodeLearningApp {...props('page', harness.sessions)} />)
    expect(screen.getByRole('button', { name: 'Show course outline' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Show course outline' }))
    expect(screen.getByRole('button', { name: 'Hide course outline' })).toBeTruthy()
    expect(screen.getByRole('separator', { name: 'Resize course outline' }).getAttribute('aria-valuenow')).toBe('386')
  })

  it('continues the Tutor conversation, switches lessons, and records progress', async () => {
    const harness = tutorHarness()
    const appProps = props('page', harness.sessions)
    appProps.actions.setTutorSession('tutor-session')
    render(<CodeLearningApp {...appProps} />)
    await screen.findByText('The learning conversation has not started yet.')

    const input = screen.getByRole('textbox', { name: /Answer your Tutor/ })
    fireEvent.keyDown(input, { key: 'a' })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })
    expect(harness.promptCall).not.toHaveBeenCalled()
    fireEvent.change(input, { target: { value: 'Why does main return int?' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })
    await waitFor(() => { expect(harness.promptCall).toHaveBeenCalledWith(
      [{ type: 'text', text: 'Why does main return int?' }], 'queue',
    ) })

    fireEvent.click(screen.getByRole('button', { name: 'Show another example of this concept' }))
    await waitFor(() => { expect(harness.promptCall).toHaveBeenCalledWith(
      [{ type: 'text', text: 'Show another example of this concept' }], 'queue',
    ) })

    fireEvent.click(screen.getByRole('button', { name: /Include stdio.h/ }))
    await waitFor(() => {
      const last = promptText(harness.promptCall.mock.calls.at(-1))
      expect(last).toContain('Switch the interactive C course')
      expect(last).toContain('Include stdio.h')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Got it, start the next lesson' }))
    expect(screen.getByLabelText('1/22 mastered')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Print text with printf' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Include stdio.h/ }))
    expect(screen.getByRole('button', { name: 'I understand this lesson' })).toBeTruthy()
  })

  it('stops a running response and can begin a fresh local learning path', async () => {
    const harness = tutorHarness()
    const appProps = props('page', harness.sessions)
    appProps.actions.setTutorSession('tutor-session')
    render(<CodeLearningApp {...appProps} />)
    await screen.findByText('The learning conversation has not started yet.')

    harness.state.set({ ...harness.state.getSnapshot(), running: true })
    fireEvent.click(await screen.findByRole('button', { name: 'Stop response' }))
    expect(harness.cancel).toHaveBeenCalledOnce()

    harness.state.set({ ...harness.state.getSnapshot(), running: false })
    fireEvent.click(screen.getByRole('button', { name: 'Start a new learning conversation' }))
    expect(screen.getByRole('heading', { name: 'Start with your AI Tutor' })).toBeTruthy()
    expect(harness.release).toHaveBeenCalled()
  })

  it('starts an existing blank Session and completes the final lesson', async () => {
    const harness = tutorHarness()
    const appProps = props('page', harness.sessions)
    appProps.actions.setTutorSession('tutor-session')
    render(<CodeLearningApp {...appProps} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Start lesson one' }))
    await waitFor(() => { expect(harness.promptCall).toHaveBeenCalledOnce() })
    expect(harness.create).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /Write through a pointer/ }))
    await waitFor(() => { expect(screen.getByRole('heading', { name: 'Write through a pointer' })).toBeTruthy() })
    fireEvent.click(screen.getByRole('button', { name: 'Complete the course' }))
    expect(screen.getByLabelText('1/22 mastered')).toBeTruthy()
  })

  it('surfaces prompt and rename failures and retries a failed retain', async () => {
    const renameFailure = tutorHarness({ renameError: true })
    const first = props('page', renameFailure.sessions)
    render(<CodeLearningApp {...first} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start lesson one' }))
    expect(await screen.findByText(/rename refused/)).toBeTruthy()
    cleanup()

    const promptFailure = tutorHarness({ promptRemoteError: true })
    const second = props('page', promptFailure.sessions)
    second.actions.setTutorSession('tutor-session')
    render(<CodeLearningApp {...second} />)
    await screen.findByText('The learning conversation has not started yet.')
    fireEvent.click(screen.getByRole('button', { name: 'Start lesson one' }))
    expect(await screen.findByText(/prompt refused/)).toBeTruthy()
    cleanup()

    const failed = Promise.reject(new Error('offline')) as Promise<SessionBinding>
    const retainFailure = tutorHarness({ ready: failed })
    const third = props('page', retainFailure.sessions)
    third.actions.setTutorSession('tutor-session')
    render(<CodeLearningApp {...third} />)
    expect(await screen.findByText(/offline/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }))
    expect(retainFailure.retain).toHaveBeenCalledTimes(2)
  })

  it('ignores Session restoration after the page is unmounted', async () => {
    const ready = deferred<SessionBinding>()
    const harness = tutorHarness({ ready: ready.promise })
    const appProps = props('page', harness.sessions)
    appProps.actions.setTutorSession('tutor-session')
    const page = render(<CodeLearningApp {...appProps} />)
    page.unmount()
    ready.resolve(harness.binding)
    await ready.promise

    const failed = deferred<SessionBinding>()
    const failureHarness = tutorHarness({ ready: failed.promise })
    const failureProps = props('page', failureHarness.sessions)
    failureProps.actions.setTutorSession('tutor-session')
    const failedPage = render(<CodeLearningApp {...failureProps} />)
    failedPage.unmount()
    failed.reject('closed')
    await expect(failed.promise).rejects.toBe('closed')
  })

  it('shows learner messages, streaming replies, and send failures', async () => {
    const harness = tutorHarness({ promptFailure: new Error('send failed') })
    const appProps = props('page', harness.sessions)
    appProps.actions.setTutorSession('tutor-session')
    render(<CodeLearningApp {...appProps} />)
    await screen.findByText('The learning conversation has not started yet.')
    harness.events.replace([
      { type: 'event', event: { type: 'user/message', seq: 1, time: 1, data: {
        content: [{ type: 'text', text: 'My answer' }], source: { kind: 'user' },
      } } },
      { type: 'transient', event: { type: 'assistant/live-chunk', seq: 2, time: 2, data: {
        attemptId: 'live', turn: 1, step: 1, chunk: { type: 'text-delta', index: 0, text: 'Streaming reply' },
      } } },
    ] as never, false)
    expect(await screen.findByText('My answer')).toBeTruthy()
    expect(screen.getByText('Streaming reply')).toBeTruthy()
    expect(screen.queryByText('Your Tutor is thinking…')).toBeNull()

    const input = screen.getByRole('textbox', { name: /Answer your Tutor/ })
    fireEvent.change(input, { target: { value: 'fail now' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText(/send failed/)).toBeTruthy()
  })

  it('handles empty quick actions, unavailable bindings, and non-Error failures', async () => {
    const empty = tutorHarness()
    const emptyProps = props('page', empty.sessions, { 'tutor.quickExample': '   ' })
    emptyProps.actions.setTutorSession('tutor-session')
    render(<CodeLearningApp {...emptyProps} />)
    await screen.findByText('The learning conversation has not started yet.')
    const blankQuickAction = screen.getAllByRole('button').find(button => button.textContent === '   ')
    expect(blankQuickAction).toBeDefined()
    fireEvent.click(blankQuickAction!)
    expect(empty.promptCall).not.toHaveBeenCalled()
    cleanup()
    localStorage.clear()

    const sendFailure = tutorHarness({ promptFailure: 'send unavailable' })
    const sendProps = props('page', sendFailure.sessions)
    sendProps.actions.setTutorSession('tutor-session')
    render(<CodeLearningApp {...sendProps} />)
    await screen.findByText('The learning conversation has not started yet.')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText(/send unavailable/)).toBeTruthy()
    cleanup()
    localStorage.clear()

    const createFailure = tutorHarness({ createFailure: 'cannot create' })
    render(<CodeLearningApp {...props('page', createFailure.sessions)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start lesson one' }))
    expect(await screen.findByText(/cannot create/)).toBeTruthy()
    cleanup()
    localStorage.clear()

    const unavailableReady = deferred<SessionBinding>()
    const unavailable = tutorHarness({ ready: unavailableReady.promise })
    const unavailableProps = props('page', unavailable.sessions)
    unavailableProps.actions.setTutorSession('tutor-session')
    render(<CodeLearningApp {...unavailableProps} />)
    unavailableReady.reject('offline')
    expect(await screen.findByText(/offline/)).toBeTruthy()
    const quick = screen.getByRole('button', { name: 'Show another example of this concept' })
    quick.removeAttribute('disabled')
    fireEvent.click(quick)
    expect(unavailable.promptCall).not.toHaveBeenCalled()
  })
})
