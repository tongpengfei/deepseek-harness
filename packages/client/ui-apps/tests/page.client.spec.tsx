// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppsPage, type AppsPageProps } from '../src/client/AppsPage.tsx'
import type { AppCatalogEntry } from '../src/client/catalog.ts'
import { en } from '../src/client/locales.ts'
import type { AppItemProps } from '../src/client/slot-contract.ts'

afterEach(cleanup)

function props(entries: readonly AppCatalogEntry[]): AppsPageProps {
  const appCatalog = {
    getSnapshot: () => entries,
    subscribe: () => () => {},
  }
  return {
    appCatalog,
    t: (key: keyof typeof en) => en[key],
    renderSlot: ((_key: 'apps.item', owner: AppItemProps) => owner.view === 'summary'
      ? <>Complete one focused task</>
      : <button type="button" onClick={() => { owner.close() }}>Finish example</button>) as AppsPageProps['renderSlot'],
  } as AppsPageProps
}

describe('AppsPage', () => {
  it('shows the empty catalog', () => {
    render(<AppsPage {...props([])} />)
    expect(screen.getByRole('heading', { name: 'Apps' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'No Apps yet' })).toBeTruthy()
    expect(screen.getByText('Apps appear here when you enable a plugin that provides one.')).toBeTruthy()
  })

  it('opens a registered App and returns through both close paths', () => {
    render(<AppsPage {...props([{ id: 'example', label: 'Example App' }])} />)

    const catalog = screen.getByRole('list', { name: 'App catalog' })
    expect(within(catalog).getByText('Complete one focused task')).toBeTruthy()
    fireEvent.click(within(catalog).getByRole('button', { name: /Example App/ }))
    expect(screen.getByRole('heading', { name: 'Example App' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Finish example' }))
    expect(screen.getByRole('list', { name: 'App catalog' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Example App/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Back to Apps' }))
    expect(screen.getByRole('list', { name: 'App catalog' })).toBeTruthy()

  })

  it('returns to the empty catalog when the selected registration unloads', async () => {
    let entries: readonly AppCatalogEntry[] = [{ id: 'example', label: 'Example App' }]
    const listeners = new Set<() => void>()
    const pageProps = props(entries)
    pageProps.appCatalog.getSnapshot = () => entries
    pageProps.appCatalog.subscribe = (listener) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    }
    render(<AppsPage {...pageProps} />)
    fireEvent.click(screen.getByRole('button', { name: /Example App/ }))
    entries = []
    for (const listener of listeners) listener()
    await waitFor(() => { expect(screen.getByRole('heading', { name: 'No Apps yet' })).toBeTruthy() })
  })
})
