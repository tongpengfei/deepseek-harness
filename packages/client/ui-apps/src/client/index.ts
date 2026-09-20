/** Browser Apps host: Slot owner, sidebar entry, and global main panel. */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { AppsPage } from './AppsPage.tsx'
import { AppsPanelIcon } from './AppsPanelIcon.tsx'
import { appCatalogSource } from './catalog.ts'
import { en, zh, type AppsLocaleKey } from './locales.ts'
import type {} from './slot-contract.ts'

export { AppsPage } from './AppsPage.tsx'
export type { AppsPageInjected, AppsPageProps } from './AppsPage.tsx'
export { AppsPanelIcon } from './AppsPanelIcon.tsx'
export { appCatalogSource } from './catalog.ts'
export type { AppCatalogEntry } from './catalog.ts'
export type { AppItemProps } from './slot-contract.ts'
export type { AppsLocaleKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Apps catalog copy. */
    'apps': AppsLocaleKey
  }
}

/** Apps dictionary namespace. */
export const NS = 'apps'

/** Main-panel and sidebar identity of the Apps catalog. */
export const PANEL_ID = 'apps' as MainPanelId

/** Browser services used by the Apps host. */
export const inject = ['slots', 'locale']

/**
 * Provide the Apps Slot and contribute its catalog to the global navigation.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-apps: dictionaries')
  const appCatalog = appCatalogSource(ctx)

  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: PANEL_ID,
    locale: NS,
    inject: (): { appCatalog: typeof appCatalog } => ({ appCatalog }),
    children: {
      'apps.item': { kind: 'list', scope: 'root' },
    },
  }, AppsPage))
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: PANEL_ID,
    order: 10,
    label: () => ctx.locale.bind(NS)('panel'),
    locale: NS,
  }, AppsPanelIcon))
}
