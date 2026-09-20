/** Slot contract for scenario Apps contributed to the Apps catalog. */

import type {} from '@deepseek-ai/dsh-client-ui-slots'

/** The catalog or full-page presentation requested from one App entry. */
export type AppItemProps =
  | {
    /** Render concise, non-interactive content inside the shell-owned card. */
    readonly view: 'summary'
  }
  | {
    /** Render the complete scenario interface. */
    readonly view: 'page'
    /** Return from the App body to the catalog. */
    close(): void
  }

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /**
     * One scenario App. The list registration's `id` is its stable identity,
     * `label` is its localized title, and `order` controls catalog position.
     */
    'apps.item': { kind: 'list'; scope: 'root'; owner: AppItemProps }
  }
}
