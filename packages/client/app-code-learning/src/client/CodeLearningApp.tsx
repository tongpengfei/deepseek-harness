/** Shared programming-course presentation, currently populated by the C course. */

import type { ReactNode } from 'react'
import { Button, IconCheckOutline16, IconChevronLeftOutline14, IconChevronRightOutline14, IconRefreshOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-apps/client'
import { cCourse } from './c-course.ts'
import type { createCourseProgressStore } from './progress-store.ts'
import css from './CodeLearningApp.module.css'

/** Props assembled by the Apps Slot renderer. */
export type CodeLearningAppProps = PropsRuntime<'apps.item'>
  & PropsLocale<'codeLearning'>
  & PropsStore<ReturnType<typeof createCourseProgressStore>>

/** Render a catalog summary or the complete programming course. */
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

function CoursePage({ t, useStore, actions }: CodeLearningAppProps): ReactNode {

  const activeLessonId = useStore(state => state.activeLessonId)
  const completedLessonIds = useStore(state => state.completedLessonIds)
  const answers = useStore(state => state.answers)
  const lesson = cCourse.lessons.find(entry => entry.id === activeLessonId) ?? cCourse.lessons[0]
  const activeIndex = cCourse.lessons.indexOf(lesson)
  const selectedOption = answers[lesson.id]
  const completed = completedLessonIds.includes(lesson.id)
  const previous = cCourse.lessons[activeIndex - 1]
  const next = cCourse.lessons[activeIndex + 1]
  const progress = (completedLessonIds.length / cCourse.lessons.length) * 100

  return (
    <div className={css.app} data-code-learning-app>
      <header className={css.hero}>
        <div>
          <p className={css.kicker}>{t('course.badge')}</p>
          <h2>{t(cCourse.title)}</h2>
          <p>{t(cCourse.description)}</p>
        </div>
        <Button variant="ghost" size="sm" icon={<IconRefreshOutline16 size={16} />}
          onClick={() => { actions.reset(cCourse.lessons[0].id) }}>
          {t('course.reset')}
        </Button>
        <div className={css.progress} aria-label={t('course.progress', {
          completed: completedLessonIds.length,
          total: cCourse.lessons.length,
        })}>
          <span style={{ width: `${String(progress)}%` }} />
        </div>
        <span className={css.progressLabel}>{t('course.progress', {
          completed: completedLessonIds.length,
          total: cCourse.lessons.length,
        })}</span>
      </header>

      <div className={css.workspace}>
        <nav className={css.outline} aria-label={t('course.lessonList')}>
          {cCourse.lessons.map((entry, index) => {
            const isActive = entry.id === lesson.id
            const isComplete = completedLessonIds.includes(entry.id)
            return (
              <button key={entry.id} type="button" className={isActive ? css.outlineActive : css.outlineItem}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => { actions.selectLesson(entry.id) }}>
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

        <main className={css.lesson}>
          <p className={css.lessonNumber}>{t('lesson.number', {
            current: activeIndex + 1,
            total: cCourse.lessons.length,
          })}</p>
          <h3>{t(lesson.title)}</h3>

          <section className={css.goal}>
            <h4>{t('lesson.objective')}</h4>
            <p>{t(lesson.objective)}</p>
          </section>

          <p className={css.explanation}>{t(lesson.explanation)}</p>

          <section className={css.codeSection}>
            <h4>{t('lesson.example')}</h4>
            <pre><code>{lesson.code}</code></pre>
          </section>

          <section className={css.challenge}>
            <h4>{t('lesson.challenge')}</h4>
            <p>{t(lesson.challenge)}</p>
            <div className={css.options}>
              {lesson.options.map((option, index) => {
                const selected = selectedOption === index
                const correct = index === lesson.correctOption
                const className = selected ? correct ? css.optionCorrect : css.optionIncorrect : css.option
                return (
                  <button key={option.label} type="button" className={className}
                    aria-pressed={selected}
                    onClick={() => { actions.answer(lesson.id, index, correct) }}>
                    <span>{String.fromCharCode(65 + index)}</span>
                    {t(option.label)}
                  </button>
                )
              })}
            </div>
            {selectedOption !== undefined && (
              <div className={completed ? css.feedbackCorrect : css.feedbackIncorrect} role="status">
                <strong>{completed ? t('lesson.correct') : t('lesson.incorrect')}</strong>
                <span>{t(completed ? lesson.correctFeedback : lesson.incorrectFeedback)}</span>
              </div>
            )}
          </section>

          <footer className={css.navigation}>
            <Button variant="outline" icon={<IconChevronLeftOutline14 size={14} />} disabled={previous === undefined}
              onClick={previous === undefined ? undefined : () => { actions.selectLesson(previous.id) }}>
              {t('lesson.previous')}
            </Button>
            <Button variant="primary" disabled={!completed || next === undefined}
              onClick={next === undefined ? undefined : () => { actions.selectLesson(next.id) }}>
              {next === undefined ? t('lesson.finish') : t('lesson.next')}
              {next !== undefined && <IconChevronRightOutline14 size={14} />}
            </Button>
          </footer>
        </main>
      </div>
    </div>
  )
}
