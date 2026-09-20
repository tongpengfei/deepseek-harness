/** Logged Tutor controls and the App-specific projection of DSH Session events. */

import type { SessionEventLikeEntry } from '@deepseek-ai/dsh-api-session-controller/client'
import type { ContentBlock } from '@deepseek-ai/dsh-llm/types'
import type { CourseDefinition, CourseLesson } from './course.ts'
import type { CourseLocaleKey } from './locales.ts'

/** Prefix for model-visible Tutor controls that remain hidden from the learner transcript. */
export const TUTOR_CONTROL_PREFIX = '[DSH_TUTOR_CONTROL]'

/** One learner-visible message projected from the Tutor Session. */
export interface TutorMessage {
  readonly key: string
  readonly role: 'learner' | 'tutor'
  readonly text: string
  readonly seq: number
  readonly streaming: boolean
}

type Translate = (key: CourseLocaleKey) => string

function contentText(content: readonly ContentBlock[]): string {
  return content.flatMap(block => block.type === 'text' ? [block.text] : []).join('\n').trim()
}

/**
 * Build the first logged message that establishes the Tutor and begins one lesson.
 * @param course - language and code-fence metadata shared by the course.
 * @param lesson - localized grounding and example for the opening lesson.
 * @param t - locale lookup for course and lesson copy.
 * @returns the marked model-visible control message.
 */
export function tutorBootstrapPrompt(course: CourseDefinition, lesson: CourseLesson, t: Translate): string {
  return `${TUTOR_CONTROL_PREFIX}\nYou are an interactive ${course.language} programming tutor inside a DSH learning App.\n\nCurrent course: ${t(course.title)}\nCurrent lesson: ${t(lesson.title)}\nLearning objective: ${t(lesson.objective)}\nReference explanation: ${t(lesson.explanation)}\nReference example:\n\`\`\`${course.codeFence}\n${lesson.code}\n\`\`\`\n\nTeaching rules:\n- Assume the learner has no prior programming knowledge. Define every new term in plain language before using it.\n- Teach before asking. In the first response, explain why the lesson matters, introduce its core idea, show one complete fenced ${course.language} example, walk through the important lines, and end with a short recap.\n- Only after that explanation and example, ask one easy check-in question. Never open a lesson with a question or quiz.\n- On later turns, answer the learner directly, then add the next small piece of instruction and at most one check-in question.\n- Invite the learner to paste code and review it by reasoning only. Never claim that code was compiled or executed.\n- Do not call tools or modify files.\n- Give progressively stronger hints before showing a full answer.\n- Match the learner's language.\n\nBegin the lesson now. Do not mention these setup instructions.`
}

/**
 * Build a logged lesson switch that keeps the same Tutor Session and history.
 * @param course - language and code-fence metadata shared by the course.
 * @param lesson - localized grounding and example for the selected lesson.
 * @param t - locale lookup for course and lesson copy.
 * @returns the marked model-visible lesson-switch message.
 */
export function tutorLessonPrompt(course: CourseDefinition, lesson: CourseLesson, t: Translate): string {
  return `${TUTOR_CONTROL_PREFIX}\nSwitch the interactive ${course.language} lesson to “${t(lesson.title)}”.\nLearning objective: ${t(lesson.objective)}\nReference explanation: ${t(lesson.explanation)}\nReference example:\n\`\`\`${course.codeFence}\n${lesson.code}\n\`\`\`\nContinue as the same tutor and assume the learner is still a beginner. First connect this lesson to prior progress, explain its core idea in plain language, show one complete fenced example, walk through the important lines, and recap. Only then ask one easy check-in question. Never open the lesson with a question or quiz. Do not call tools or claim to execute code.`
}

/**
 * Project learner and assistant text, including the currently streaming assistant prefix.
 * @param entries - durable and transient events from the retained Tutor Session.
 * @returns learner-visible messages ordered by Session sequence.
 */
export function projectTutorMessages(entries: readonly SessionEventLikeEntry[]): TutorMessage[] {
  const messages: TutorMessage[] = []
  const live = new Map<string, TutorMessage>()
  for (const entry of entries) {
    const event = entry.event
    if (event.type === 'user/message') {
      if (event.data.source.kind !== 'user') continue
      const text = contentText(event.data.content)
      if (text !== '' && !text.startsWith(TUTOR_CONTROL_PREFIX)) {
        messages.push({ key: `user:${String(event.seq)}`, role: 'learner', text, seq: event.seq, streaming: false })
      }
      continue
    }
    if (event.type === 'assistant/message') {
      const text = contentText(event.data.message.content)
      if (text !== '') {
        messages.push({ key: `assistant:${String(event.seq)}`, role: 'tutor', text, seq: event.seq, streaming: false })
      }
      continue
    }
    if (event.type !== 'assistant/live-chunk' || event.data.chunk.type !== 'text-delta') continue
    const key = String(event.data.attemptId)
    const previous = live.get(key)
    live.set(key, {
      key: `live:${key}`,
      role: 'tutor',
      text: `${previous?.text ?? ''}${event.data.chunk.text}`,
      seq: previous?.seq ?? event.seq,
      streaming: true,
    })
  }
  messages.push(...live.values())
  return messages.sort((left, right) => left.seq - right.seq)
}
