/** Sidebar glyph for the Apps catalog. */

import type { ReactNode } from 'react'
import { IconSparkle16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'

/**
 * Render the Apps glyph at the size the sidebar asks for.
 * @param props - sidebar icon props.
 * @returns the icon element.
 */
export function AppsPanelIcon({ size }: PropsRuntime<'sidebar.panellist'>): ReactNode {
  return <IconSparkle16 size={size} />
}
