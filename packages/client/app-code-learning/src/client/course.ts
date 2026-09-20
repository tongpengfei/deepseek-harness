/** Language-independent programming-course data consumed by the shared lesson UI. */

import type { CourseLocaleKey } from './locales.ts'

/** One answer offered by a lesson challenge. */
export interface ChallengeOption {
  readonly label: CourseLocaleKey
}

/** One explain-example-check step in a programming course. */
export interface CourseLesson {
  readonly id: string
  readonly title: CourseLocaleKey
  readonly objective: CourseLocaleKey
  readonly explanation: CourseLocaleKey
  readonly code: string
  readonly challenge: CourseLocaleKey
  readonly options: readonly ChallengeOption[]
  readonly correctOption: number
  readonly correctFeedback: CourseLocaleKey
  readonly incorrectFeedback: CourseLocaleKey
}

/** Data needed to teach one programming language through the shared course flow. */
export interface CourseDefinition {
  readonly id: string
  readonly title: CourseLocaleKey
  readonly description: CourseLocaleKey
  readonly lessons: readonly [CourseLesson, ...CourseLesson[]]
}
