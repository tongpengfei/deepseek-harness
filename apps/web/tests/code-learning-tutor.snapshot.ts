import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { AgentHandle } from '@deepseek-ai/dsh-agent'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { SessionId } from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-agent-presets'
import { cCourse } from '../../../packages/client/app-code-learning/src/client/c-course.ts'
import { type CourseLocaleKey, zh } from '../../../packages/client/app-code-learning/src/client/locales.ts'
import { projectTutorMessages, tutorBootstrapPrompt } from '../../../packages/client/app-code-learning/src/client/tutor-session.ts'
import { assertFixtureInventory, launchWebScaffold, type WebScaffold } from './scaffold.ts'

const SNAPSHOT_DIR = fileURLToPath(new URL('../../../snapshots/web/code-learning-tutor', import.meta.url))
const FIXTURE = join(SNAPSHOT_DIR, 'session.v3.jsonl')

/** Chinese course copy without interpolation, matching the recorded live Tutor turn. */
function translate(key: CourseLocaleKey): string {
  return zh[key]
}

describe('code-learning Tutor Session', () => {
  let scaffold: WebScaffold
  let agentHandle: AgentHandle

  beforeAll(async () => {
    scaffold = await launchWebScaffold({ replayFixture: FIXTURE, compareReplaySession: true })
    agentHandle = await scaffold.ctx.agents.create({
      sessionId: SessionId('code-learning-tutor'),
      meta: { cwd: scaffold.workspaceCwd, agentPreset: 'learning' },
      agentOptions: { provider: 'deepseek-official', model: 'deepseek-v4-flash' },
      setup: agentCtx => scaffold.ctx.agentPresets.mount(agentCtx, 'learning').then(() => undefined),
    })
    agentHandle.agent.followup(createUserMessage({
      content: [{ type: 'text', text: tutorBootstrapPrompt(cCourse, cCourse.lessons[0], translate) }],
      source: { kind: 'user' },
    }))
    await agentHandle.agent.whenIdle()
  })

  afterAll(async () => {
    const failures: unknown[] = []
    await agentHandle?.dispose().catch((error: unknown) => failures.push(error))
    await scaffold?.close().catch((error: unknown) => failures.push(error))
    if (failures.length === 1) throw failures[0]
    if (failures.length > 1) throw new AggregateError(failures, 'code-learning Tutor teardown failed')
  })

  it('replays a focused, natural lesson opening before offering practice', () => {
    const entries = agentHandle.agent.session.snapshotEvents().map(event => ({ type: 'event' as const, event }))
    const messages = projectTutorMessages(entries)
    expect(messages.map(message => message.role)).toEqual(['tutor'])
    const answer = messages[0]?.text ?? ''
    expect(answer).toContain('main')
    expect(answer).toContain('int main(void)')
    expect(answer).not.toContain('stdio.h')
    expect(answer).not.toContain('printf')
    expect(answer).not.toContain('Complete a program')
    expect(answer).not.toContain('一个新知识点')
    expect(answer).not.toContain('这节课只')
    expect(agentHandle.agent.session.requestHeader()?.tools).toBeUndefined()
  })

  it('keeps its snapshot inventory closed', async () => {
    await assertFixtureInventory(SNAPSHOT_DIR, [
      'session.v3.jsonl',
      'system-prompt.expected.md',
      'tool-schemas.expected.json',
    ])
  })
})
