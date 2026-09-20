// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
import { createClientTest, webApp } from '@deepseek-ai/dsh-client-test-runtime/src/assembly/index.ts'
import { AppsPage } from '../src/client/AppsPage.tsx'
import { AppsPanelIcon } from '../src/client/AppsPanelIcon.tsx'
import { appCatalogSource } from '../src/client/catalog.ts'
import { inject, NS, PANEL_ID } from '../src/client/index.ts'
import { apply as hostApply } from '../src/index.ts'
import type { AppItemProps } from '../src/client/slot-contract.ts'

const test = createClientTest({ roster: webApp })
const SELF = '@deepseek-ai/dsh-client-ui-apps'

afterEach(cleanup)

function ExampleApp({ view }: AppItemProps) {
  return view === 'summary' ? <>Example summary</> : <>Example body</>
}

describe('ui-apps composition', () => {
  test('loads through the Web roster and releases the Slot and navigation entries on unload', async ({ start }) => {
    const client = await start()
    expect(inject).toEqual(['slots', 'locale'])
    const main = client.ctx.slots.entries('main').find(entry => entry.options.key === PANEL_ID)!
    const sidebar = client.ctx.slots.entries('sidebar.panellist').find(entry => entry.options.id === PANEL_ID)!
    expect(main.component).toBe(AppsPage)
    expect(main.locale).toBe(NS)
    expect((main.inject as () => unknown)()).toHaveProperty('appCatalog')
    expect(sidebar.component).toBe(AppsPanelIcon)
    expect(sidebar.options).toMatchObject({ order: 10 })
    expect(resolveSlotLabel(sidebar.options.label)).toBe('Apps')
    expect(client.ctx.slots.spec('apps.item')).toEqual({ kind: 'list', scope: 'root' })

    const catalog = appCatalogSource(client.ctx)
    const listener = vi.fn()
    const unsubscribe = catalog.subscribe(listener)
    const initial = catalog.getSnapshot()
    expect(initial).toEqual([{ id: 'learn-c', label: 'Learn C' }])
    expect(catalog.getSnapshot()).toBe(initial)
    const provider = client.ctx.plugin({
      name: 'example-app',
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('apps.item', () => ctx.slots.register({
          name: 'apps.item',
          id: 'example',
          order: 5,
          label: () => 'Example App',
        }, ExampleApp))
      },
    })
    await provider.await()
    await client.flush()
    expect(catalog.getSnapshot()).toEqual([
      { id: 'example', label: 'Example App' },
      { id: 'learn-c', label: 'Learn C' },
    ])
    expect(listener).toHaveBeenCalled()

    const invalid = client.ctx.plugin({
      name: 'invalid-app',
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('apps.item', () => ctx.slots.register({
          name: 'apps.item',
          id: 'missing-label',
        }, ExampleApp))
      },
    })
    await invalid.await()
    await client.flush()
    expect(() => catalog.getSnapshot()).toThrow('must register a label')
    await invalid.dispose()
    unsubscribe()
    await provider.dispose()

    await client.unload(SELF)
    await client.flush()
    expect(client.ctx.slots.entries('main').some(entry => entry.options.key === PANEL_ID)).toBe(false)
    expect(client.ctx.slots.entries('sidebar.panellist').some(entry => entry.options.id === PANEL_ID)).toBe(false)
    expect(client.ctx.slots.spec('apps.item')).toBeUndefined()
  }, 60_000)

  it('renders the sidebar icon', () => {
    const unread = () => { throw new Error('The Apps icon must not read application state') }
    render(<AppsPanelIcon size={20} active={false}
      usePanelInfo={unread} useSessions={unread} useSessionStatus={unread} useSessionRetainInfo={unread}
      useWorkspaces={unread} useResource={unread} />)
    expect(document.querySelector('svg')).toBeTruthy()
  })

  it('keeps the Host Loader entry inert', () => {
    expect(hostApply).not.toThrow()
  })
})
