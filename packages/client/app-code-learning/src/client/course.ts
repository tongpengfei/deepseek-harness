/** Language-independent curriculum data consumed by the conversational Tutor. */

import type { CourseLocaleKey } from './locales.ts'

/** One lesson that grounds the Tutor's explanation and examples. */
export interface CourseLesson {
  readonly id: string
  readonly title: CourseLocaleKey
  readonly objective: CourseLocaleKey
  readonly explanation: CourseLocaleKey
  readonly syntax: string
  readonly code: string
  readonly practice: CourseLocaleKey
}

/** Data needed to teach one programming language through the shared Tutor flow. */
export interface CourseDefinition {
  readonly id: string
  readonly language: string
  readonly codeFence: string
  readonly title: CourseLocaleKey
  readonly description: CourseLocaleKey
  readonly lessons: readonly [CourseLesson, ...CourseLesson[]]
}
