/** Apps catalog and selected-App host for the global main panel. */

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Button, IconChevronLeftOutline14, IconSparkle16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  HostObservable, InjectFace, PropsLocale, PropsRenderSlots, PropsRuntime,
} from '@deepseek-ai/dsh-client-ui-slots'
import type { AppCatalogEntry } from './catalog.ts'
import type {} from './slot-contract.ts'
import css from './AppsPage.module.css'

/** Services injected into the Apps main-panel registration. */
export interface AppsPageInjected {
  readonly appCatalog: HostObservable<readonly AppCatalogEntry[]>
}

/** Complete props assembled by the main slot renderer. */
export type AppsPageProps =
  PropsRuntime<'main'>
  & PropsLocale<'apps'>
  & PropsRenderSlots<'apps.item'>
  & InjectFace<AppsPageInjected>

/** Render the App catalog or the selected App. */
export function AppsPage({ appCatalog, renderSlot, t }: AppsPageProps): ReactNode {
  const entries = useSyncExternalStore(
    listener => appCatalog.subscribe(listener),
    () => appCatalog.getSnapshot(),
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId === null ? undefined : entries.find(entry => entry.id === selectedId)

  useEffect(() => {
    if (selectedId !== null && selected === undefined) setSelectedId(null)
  }, [selected, selectedId])

  if (selected !== undefined) {
    return (
      <section className={css.page} data-apps-panel data-app-id={selected.id}>
        <header className={css.appHeader}>
          <Button
            variant="ghost"
            size="sm"
            icon={<IconChevronLeftOutline14 size={14} />}
            aria-label={t('back')}
            onClick={() => { setSelectedId(null) }}
          >
            {t('back')}
          </Button>
          <h1 className={css.appTitle}>{selected.label}</h1>
        </header>
        <div className={css.appBody}>
          {renderSlot('apps.item', {
            view: 'page',
            close: () => { setSelectedId(null) },
          }, { only: selected.id })}
        </div>
      </section>
    )
  }

  return (
    <section className={css.page} data-apps-panel>
      <header className={css.catalogHeader}>
        <h1 className={css.title}>{t('title')}</h1>
        <p className={css.intro}>{t('intro')}</p>
      </header>
      {entries.length === 0
        ? (
          <div className={css.empty}>
            <IconSparkle16 size={28} />
            <h2>{t('emptyTitle')}</h2>
            <p>{t('emptyDescription')}</p>
          </div>
        )
        : (
          <ul className={css.catalog} aria-label={t('catalog')}>
            {entries.map(app => (
              <li key={app.id}>
                <button className={css.card} type="button" onClick={() => { setSelectedId(app.id) }}>
                  <strong>{app.label}</strong>
                  <span className={css.summary}>
                    {renderSlot('apps.item', {
                      view: 'summary',
                    }, { only: app.id })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
    </section>
  )
}
