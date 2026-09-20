/** Conversational programming Tutor backed by one durable DSH Session. */

import {
  useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore,
  type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode,
} from 'react'
import {
  Button, IconCheckOutline16, IconRefreshOutline16, IconSendOutline14,
  IconPanelLeftOutline16, IconSparkle16, IconStopFill16, MarkdownText, type MarkdownLabels,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  ISessions, SessionBinding, SessionEventWindow, SessionFace, SessionSnapshot,
} from '@deepseek-ai/dsh-api-session-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-apps/client'
import { cCourse } from './c-course.ts'
import type { CourseLesson } from './course.ts'
import type { createCourseProgressStore } from './progress-store.ts'
import { projectTutorMessages, tutorBootstrapPrompt, tutorLessonPrompt } from './tutor-session.ts'
import css from './CodeLearningApp.module.css'

declare module '@deepseek-ai/dsh-api-session-controller/client' {
  interface SessionReferenceSourceMap {
    codeLearningTutor: unknown
  }
}

/** Root services passed into the Tutor presentation. */
export interface CodeLearningAppInjected {
  readonly sessions: ISessions
}

/** Props assembled by the Apps Slot renderer. */
export type CodeLearningAppProps = PropsRuntime<'apps.item'>
  & PropsLocale<'codeLearning'>
  & PropsStore<ReturnType<typeof createCourseProgressStore>>
  & InjectFace<CodeLearningAppInjected>

const COURSE_LAYOUT_KEY = 'dsh.app.code-learning.layout.v1'
const DEFAULT_SIDEBAR_WIDTH = 270
const MIN_SIDEBAR_WIDTH = 220
const MAX_SIDEBAR_WIDTH = 480
const MIN_TUTOR_WIDTH = 360
const RESIZE_TRACK_WIDTH = 16

interface CourseLayoutPreference {
  readonly sidebarWidth: number
  readonly collapsed: boolean
}

function clampSidebarWidth(width: number, available = MAX_SIDEBAR_WIDTH): number {
  return Math.min(Math.max(MIN_SIDEBAR_WIDTH, width), Math.max(MIN_SIDEBAR_WIDTH, available))
}

function readCourseLayout(): CourseLayoutPreference {
  try {
    const stored = JSON.parse(localStorage.getItem(COURSE_LAYOUT_KEY) ?? 'null') as unknown
    if (typeof stored === 'object' && stored !== null && 'sidebarWidth' in stored && 'collapsed' in stored
      && typeof stored.sidebarWidth === 'number' && Number.isFinite(stored.sidebarWidth)
      && typeof stored.collapsed === 'boolean') {
      return { sidebarWidth: clampSidebarWidth(stored.sidebarWidth), collapsed: stored.collapsed }
    }
  } catch (error) {
    // Storage can be unavailable or contain an older invalid value; the default layout remains usable.
    void error
  }
  return { sidebarWidth: DEFAULT_SIDEBAR_WIDTH, collapsed: false }
}

function writeCourseLayout(preference: CourseLayoutPreference): void {
  try {
    localStorage.setItem(COURSE_LAYOUT_KEY, JSON.stringify(preference))
  } catch (error) {
    // A storage failure must not disable resizing for the current page.
    void error
  }
}

function useObservable<T>(source: ObservableSnapshot<T> | undefined): T | undefined {
  const subscribe = useCallback((listener: () => void) => source?.subscribe(listener) ?? (() => {}), [source])
  const getSnapshot = useCallback(() => source?.getSnapshot(), [source])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

async function prompt(session: SessionFace, text: string): Promise<void> {
  const result = await session.prompt([{ type: 'text', text }], 'queue')
  if (!result.ok) throw new Error(result.error.message)
}

/** Render a catalog summary or the complete conversational Tutor. */
export function CodeLearningApp(props: CodeLearningAppProps): ReactNode {
  if (props.view === 'summary') {
    return (
      <span className={css.summary} data-code-learning-summary>
        <span>{props.t('app.summary')}</span>
        <span className={css.summaryMeta}>{props.t('app.lessonCount')}</span>
      </span>
    )
  }
  return <CoursePage {...props} />
}

function CoursePage({ t, useStore, actions, sessions }: CodeLearningAppProps): ReactNode {
  const activeLessonId = useStore(state => state.activeLessonId)
  const completedLessonIds = useStore(state => state.completedLessonIds)
  const tutorSessionId = useStore(state => state.tutorSessionId)
  const lesson = cCourse.lessons.find(entry => entry.id === activeLessonId) ?? cCourse.lessons[0]
  const activeIndex = cCourse.lessons.indexOf(lesson)
  const [initialLayout] = useState(readCourseLayout)
  const [binding, setBinding] = useState<SessionBinding>()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [retainRevision, setRetainRevision] = useState(0)
  const [sidebarWidth, setSidebarWidth] = useState(initialLayout.sidebarWidth)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialLayout.collapsed)
  const [resizingSidebar, setResizingSidebar] = useState(false)
  const appRoot = useRef<HTMLDivElement>(null)
  const messageEnd = useRef<HTMLDivElement>(null)
  const resizeStart = useRef<{ pointerId: number; clientX: number; width: number }>()

  useEffect(() => {
    setBinding(undefined)
    if (tutorSessionId === undefined) return
    let active = true
    const reference = sessions.retain(tutorSessionId as SessionId, { source: 'codeLearningTutor' })
    void reference.ready.then(() => {
      if (active) {
        setBinding(reference.binding)
        setError(undefined)
      }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : String(reason))
    })
    return () => {
      active = false
      reference.release()
    }
  }, [retainRevision, sessions, tutorSessionId])

  const sessionState = useObservable<SessionSnapshot>(binding?.session)
  const eventWindow = useObservable<SessionEventWindow>(binding?.eventSource)
  const messages = useMemo(() => projectTutorMessages(eventWindow?.entries ?? []), [eventWindow])
  const markdownLabels = useMemo<MarkdownLabels>(() => ({
    code: { copyLabel: t('markdown.copy'), copiedLabel: t('markdown.copied') },
    footnotes: t('markdown.footnotes'),
  }), [t])
  const running = sessionState?.running ?? false
  const inputDisabled = busy || running || binding === undefined
  const progress = (completedLessonIds.length / cCourse.lessons.length) * 100

  useEffect(() => {
    writeCourseLayout({ sidebarWidth, collapsed: sidebarCollapsed })
  }, [sidebarCollapsed, sidebarWidth])

  const availableSidebarWidth = useCallback((): number => {
    const rootWidth = appRoot.current?.getBoundingClientRect().width ?? 0
    if (rootWidth <= 0) return MAX_SIDEBAR_WIDTH
    return Math.min(MAX_SIDEBAR_WIDTH, rootWidth - MIN_TUTOR_WIDTH - RESIZE_TRACK_WIDTH)
  }, [])

  const setClampedSidebarWidth = useCallback((width: number): void => {
    setSidebarWidth(clampSidebarWidth(width, availableSidebarWidth()))
  }, [availableSidebarWidth])

  useEffect(() => {
    if (!resizingSidebar) return
    const move = (event: PointerEvent): void => {
      const start = resizeStart.current
      if (start === undefined || event.pointerId !== start.pointerId) return
      setClampedSidebarWidth(start.width + event.clientX - start.clientX)
    }
    const finish = (event: PointerEvent): void => {
      if (event.pointerId !== resizeStart.current?.pointerId) return
      resizeStart.current = undefined
      setResizingSidebar(false)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
    }
  }, [resizingSidebar, setClampedSidebarWidth])

  useEffect(() => {
    const marker = messageEnd.current
    if (typeof marker?.scrollIntoView === 'function') marker.scrollIntoView({ block: 'end' })
  }, [messages, running])

  const send = useCallback(async (text: string): Promise<void> => {
    const value = text.trim()
    if (value === '' || binding === undefined) return
    setBusy(true)
    setError(undefined)
    try {
      await prompt(binding.session, value)
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }, [binding])

  const startTutor = useCallback(async (): Promise<void> => {
    setBusy(true)
    setError(undefined)
    try {
      const id = tutorSessionId as SessionId | undefined ?? await sessions.create({ agentPreset: 'learning' })
      actions.setTutorSession(id)
      await sessions.using(id, { source: 'codeLearningTutor' }, async (reference) => {
        const rename = await reference.binding.session.rename(t('app.name'))
        if (!rename.ok) throw new Error(rename.error.message)
        await prompt(reference.binding.session, tutorBootstrapPrompt(cCourse, lesson, t))
      })
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }, [actions, lesson, sessions, t, tutorSessionId])

  const selectLesson = useCallback((nextLesson: CourseLesson): void => {
    if (nextLesson.id === lesson.id) return
    actions.selectLesson(nextLesson.id)
    if (binding !== undefined) void send(tutorLessonPrompt(cCourse, nextLesson, t))
  }, [actions, binding, lesson.id, send, t])

  const completeLesson = useCallback((): void => {
    actions.completeLesson(lesson.id)
    const next = cCourse.lessons[activeIndex + 1]
    if (next !== undefined) selectLesson(next)
  }, [actions, activeIndex, lesson.id, selectLesson])

  const submitDraft = (): void => {
    const value = draft.trim()
    if (value === '') return
    setDraft('')
    void send(value)
  }

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    submitDraft()
  }

  const beginSidebarResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return
    event.preventDefault()
    resizeStart.current = { pointerId: event.pointerId, clientX: event.clientX, width: sidebarWidth }
    setResizingSidebar(true)
  }

  const handleSidebarResizeKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    let width: number | undefined
    if (event.key === 'ArrowLeft') width = sidebarWidth - 16
    if (event.key === 'ArrowRight') width = sidebarWidth + 16
    if (event.key === 'Home') width = MIN_SIDEBAR_WIDTH
    if (event.key === 'End') width = availableSidebarWidth()
    if (width === undefined) return
    event.preventDefault()
    setClampedSidebarWidth(width)
  }

  return (
    <div ref={appRoot} className={`${css.app}${sidebarCollapsed ? ` ${css.appCollapsed}` : ''}`}
      data-code-learning-app data-resizing={resizingSidebar || undefined}
      style={{ '--course-sidebar-width': `${String(sidebarWidth)}px` } as CSSProperties}>
      <aside className={css.courseSidebar} aria-hidden={sidebarCollapsed || undefined}>
        <header className={css.hero}>
          <div className={css.courseIdentity}>
            <p className={css.kicker}>{t('course.badge')}</p>
            <div className={css.courseHeading}>
              <h2>{t(cCourse.title)}</h2>
              <p>{t(cCourse.description)}</p>
            </div>
            <button type="button" className={css.sidebarToggle} aria-label={t('course.hideOutline')}
              title={t('course.hideOutline')} onClick={() => { setSidebarCollapsed(true) }}>
              <IconPanelLeftOutline16 size={16} />
            </button>
          </div>
          <div className={css.progressRow}>
            <span>{t('course.progress', {
              completed: completedLessonIds.length,
              total: cCourse.lessons.length,
            })}</span>
            <div className={css.progress} aria-label={t('course.progress', {
              completed: completedLessonIds.length,
              total: cCourse.lessons.length,
            })}>
              <span style={{ width: `${String(progress)}%` }} />
            </div>
          </div>
          <Button variant="ghost" size="sm" icon={<IconRefreshOutline16 size={16} />}
            onClick={() => { actions.reset(cCourse.lessons[0].id) }}>
            {t('course.newSession')}
          </Button>
        </header>

        <nav className={css.outline} aria-label={t('course.lessonList')}>
          {cCourse.lessons.map((entry, index) => {
            const isActive = entry.id === lesson.id
            const isComplete = completedLessonIds.includes(entry.id)
            return (
              <button key={entry.id} type="button" className={isActive ? css.outlineActive : css.outlineItem}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => { selectLesson(entry) }}>
                <span className={css.lessonIndex}>{isComplete ? <IconCheckOutline16 size={14} /> : index + 1}</span>
                <span>
                  <strong>{t(entry.title)}</strong>
                  <small>{isComplete ? t('lesson.completed') : isActive ? t('lesson.current') : t('lesson.number', {
                    current: index + 1,
                    total: cCourse.lessons.length,
                  })}</small>
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      <div className={css.resizeHandle} role="separator" aria-orientation="vertical"
        aria-label={t('course.resizeOutline')} aria-valuemin={MIN_SIDEBAR_WIDTH}
        aria-valuemax={MAX_SIDEBAR_WIDTH} aria-valuenow={Math.round(sidebarWidth)} tabIndex={0}
        onPointerDown={beginSidebarResize} onKeyDown={handleSidebarResizeKey} />

      <div className={css.collapsedRail}>
        <button type="button" aria-label={t('course.showOutline')} title={t('course.showOutline')}
          onClick={() => { setSidebarCollapsed(false) }}>
          <IconPanelLeftOutline16 size={16} />
        </button>
      </div>

      <main className={css.tutor}>
        <header className={css.lessonHeader}>
          <div>
            <p>{t('lesson.number', { current: activeIndex + 1, total: cCourse.lessons.length })}</p>
            <h3>{t(lesson.title)}</h3>
            <span>{t(lesson.objective)}</span>
          </div>
          {binding !== undefined && (
            <Button variant="outline" size="sm" onClick={completeLesson}>
              {activeIndex + 1 === cCourse.lessons.length
                ? t('lesson.courseComplete')
                : completedLessonIds.includes(lesson.id)
                  ? t('lesson.markComplete')
                  : t('lesson.completeAndNext')}
            </Button>
          )}
        </header>

        {tutorSessionId === undefined
          ? (
            <section className={css.onboarding}>
              <IconSparkle16 size={24} />
              <h4>{t('tutor.startTitle')}</h4>
              <p>{t('tutor.startDescription')}</p>
              <Button variant="primary" disabled={busy} onClick={() => { void startTutor() }}>
                {t('tutor.start')}
              </Button>
              {error !== undefined && (
                <div className={css.error} role="alert">
                  <span>{t('tutor.error', { message: error })}</span>
                </div>
              )}
            </section>
          )
          : binding === undefined && error === undefined
            ? <div className={css.centerStatus} role="status">{t('tutor.restoring')}</div>
            : (
              <div className={css.conversation}>
                <section className={css.messages} aria-live="polite">
                  {messages.length === 0 && !running && (
                    <div className={css.emptyConversation}>
                      <p>{t('tutor.empty')}</p>
                      <Button variant="primary" disabled={busy} onClick={() => { void startTutor() }}>
                        {t('tutor.start')}
                      </Button>
                    </div>
                  )}
                  {messages.map(message => (
                    <article key={message.key} className={message.role === 'tutor' ? css.tutorMessage : css.learnerMessage}>
                      <strong>{t(message.role === 'tutor' ? 'tutor.name' : 'tutor.you')}</strong>
                      <MarkdownText text={message.text} streaming={message.streaming} labels={markdownLabels}
                        codeLineNumbers />
                    </article>
                  ))}
                  {running && messages.every(message => !message.streaming) && (
                    <div className={css.thinking} role="status">{t('tutor.thinking')}</div>
                  )}
                  <div ref={messageEnd} />
                </section>

                {error !== undefined && (
                  <div className={css.error} role="alert">
                    <span>{t('tutor.error', { message: error })}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setRetainRevision(value => value + 1) }}>
                      {t('tutor.retry')}
                    </Button>
                  </div>
                )}

                <div className={css.quickActions}>
                  {(['tutor.quickExample', 'tutor.quickExplain', 'tutor.quickExercise', 'tutor.quickSummary'] as const)
                    .map(key => (
                      <button key={key} type="button" disabled={inputDisabled} onClick={() => { void send(t(key)) }}>
                        {t(key)}
                      </button>
                    ))}
                </div>

                <footer className={css.composer}>
                  <textarea value={draft} disabled={inputDisabled} aria-label={t('tutor.placeholder')}
                    placeholder={t('tutor.placeholder')} rows={3}
                    onChange={(event) => { setDraft(event.currentTarget.value) }} onKeyDown={handleDraftKeyDown} />
                  <div className={css.composerFooter}>
                    <span>{t('tutor.reviewNotice')}</span>
                    {running
                      ? (
                        <Button variant="outline" size="sm" icon={<IconStopFill16 size={16} />}
                          onClick={() => { void binding?.session.cancel() }}>
                          {t('tutor.stop')}
                        </Button>
                      )
                      : (
                        <Button variant="primary" size="sm" icon={<IconSendOutline14 size={14} />}
                          disabled={inputDisabled || draft.trim() === ''} onClick={submitDraft}>
                          {t('tutor.send')}
                        </Button>
                      )}
                  </div>
                </footer>
              </div>
            )}
      </main>
    </div>
  )
}
