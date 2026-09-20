/** Observable projection of the Apps slot ledger. */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { resolveSlotLabel, type HostObservable } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from './slot-contract.ts'

/** One App as the catalog shell identifies and titles it. */
export interface AppCatalogEntry {
  readonly id: string
  readonly label: string
}

/**
 * Project active App registrations into a locale-aware catalog.
 * @param ctx - Apps-shell browser context.
 * @returns observable catalog that preserves its snapshot between relevant changes.
 */
export function appCatalogSource(ctx: ClientContext): HostObservable<readonly AppCatalogEntry[]> {
  let version = -1
  let localeRevision = -1
  let catalog: readonly AppCatalogEntry[] = []
  return {
    getSnapshot: () => {
      const nextVersion = ctx.slots.getVersion('apps.item')
      const nextLocaleRevision = ctx.locale.getSnapshot().revision
      if (version !== nextVersion || localeRevision !== nextLocaleRevision) {
        version = nextVersion
        localeRevision = nextLocaleRevision
        catalog = ctx.slots.entries('apps.item').map((entry) => {
          /* v8 ignore next -- list-slot registration requires id */
          const id = entry.options.id ?? ''
          const label = resolveSlotLabel(entry.options.label)
          if (label === undefined) throw new Error(`apps: ${JSON.stringify(id)} must register a label`)
          return { id, label }
        })
      }
      return catalog
    },
    subscribe: (listener) => {
      const offSlot = ctx.slots.subscribe('apps.item', listener)
      const offLocale = ctx.locale.subscribe(listener)
      return () => {
        offSlot()
        offLocale()
      }
    },
  }
}
