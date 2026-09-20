// @vitest-environment jsdom
import { describe, expect } from 'vitest'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
import { createClientTest, webApp } from '@deepseek-ai/dsh-client-test-runtime/src/assembly/index.ts'
import { CodeLearningApp } from '../src/client/CodeLearningApp.tsx'
import { apply as hostApply } from '../src/index.ts'

const test = createClientTest({ roster: webApp })

describe('code-learning App composition', () => {
  test('loads the C course through the shipped Web roster', async ({ start }) => {
    const client = await start()
    const entry = client.ctx.slots.entries('apps.item').find(candidate => candidate.options.id === 'learn-c')
    expect(entry?.component).toBe(CodeLearningApp)
    expect(entry?.options.order).toBe(10)
    expect(resolveSlotLabel(entry?.options.label)).toBe('Learn C')
    expect(entry?.locale).toBe('codeLearning')
    expect(entry?.store).toBeDefined()
    expect((entry?.inject as (() => { sessions: unknown }))().sessions).toBe(client.ctx.sessions)
  }, 60_000)

  test('keeps the Host Loader entry inert', () => {
    expect(hostApply).not.toThrow()
  })
})
