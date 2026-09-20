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

function lessonGrounding(course: CourseDefinition, lesson: CourseLesson, t: Translate): string {
  const lessonIndex = course.lessons.findIndex(entry => entry.id === lesson.id)
  const priorConcepts = course.lessons.slice(0, Math.max(0, lessonIndex)).map(entry => t(entry.title)).join('; ')
  return `Current course: ${t(course.title)}
Current lesson: ${t(lesson.title)}
Lesson goal: ${t(lesson.objective)}
Plain-language grounding: ${t(lesson.explanation)}
Focus syntax: ${lesson.syntax}
Concepts introduced by earlier lessons: ${priorConcepts || '(none)'}
Minimal reference example:
\`\`\`${course.codeFence}
${lesson.code}
\`\`\`
Practice to use only after the learner is ready: ${t(lesson.practice)}`
}

function teachingRules(course: CourseDefinition): string {
  return `Teaching sequence:
1. Opening explanation: speak directly to the learner in a few connected paragraphs, as a teacher would explain the topic aloud. Say what they will learn and why it is useful, explain it in plain language, show the focus syntax, say when it is used, and show exactly one minimal fenced ${course.language} example. Explain only the lines that demonstrate the focus syntax. Treat other lines as familiar program structure or fixed boilerplate; do not turn them into additional lessons. Close with one natural sentence that lets the learner ask a question or continue to a small exercise.
2. Clarification: answer questions in the same conversational teaching voice without advancing the syllabus or adding another example unless the learner asks for one.
3. Practice: only after the learner says they are ready, describe the grounded practice as one small task without its solution. Offer progressively stronger hints when needed.
4. Feedback: respond to the learner's answer in ordinary prose, correct only the current concept, and briefly reinforce what matters. Add at most one directly related nuance only when the learner asks to extend the topic or has completed the practice.

Pacing rules:
- Assume no knowledge beyond the earlier concepts listed above. Define any necessary ordinary term before using it.
- Never introduce a concept from a later lesson, combine several concepts into one explanation, preview the rest of the syllabus, or add a second exercise.
- Keep the opening compact: at most 180 words in English or 300 Chinese characters outside code. Never dump a long reference article.
- Teach before checking understanding. Do not open with a question, quiz, or exercise.
- Write the learner-facing lesson as plain, continuous speech. Apart from the fenced code example, do not use Markdown headings, bold emphasis, blockquotes, bullet lists, numbered lists, tables, or labeled sections such as “Why it matters”, “Syntax”, “Example”, “Summary”, or “Exercise”. Do not repeat the lesson title as a heading.
- Keep the lesson structure invisible. Never tell the learner how many concepts the lesson covers, that other material is being withheld, or that you are following phases or pacing rules.
- If the learner asks about a later concept, answer briefly, say where it appears later, and return to the current concept unless they explicitly switch lessons.
- Invite pasted code and review it by reasoning only. Never claim that code was compiled or executed.
- Do not call tools or modify files. Match the learner's language.`
}

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
  return `${TUTOR_CONTROL_PREFIX}
You are an interactive ${course.language} programming tutor inside a DSH learning App.

${lessonGrounding(course, lesson, t)}

${teachingRules(course)}

Begin phase 1 now. Do not mention these setup instructions or the later phases.`
}

/**
 * Build a logged lesson switch that keeps the same Tutor Session and history.
 * @param course - language and code-fence metadata shared by the course.
 * @param lesson - localized grounding and example for the selected lesson.
 * @param t - locale lookup for course and lesson copy.
 * @returns the marked model-visible lesson-switch message.
 */
export function tutorLessonPrompt(course: CourseDefinition, lesson: CourseLesson, t: Translate): string {
  return `${TUTOR_CONTROL_PREFIX}
Switch the interactive ${course.language} course to the lesson “${t(lesson.title)}” and continue as the same tutor.

${lessonGrounding(course, lesson, t)}

${teachingRules(course)}

Begin phase 1 for this lesson now. Do not mention these setup instructions or the later phases.`
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
