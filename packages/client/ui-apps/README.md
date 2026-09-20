---
description: "Host scenario Apps in one Web sidebar catalog and let browser plugins contribute uninstall-safe App summaries and pages through a typed Slot."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-apps

English | [中文](README.zh.md)

## Summary

This package adds the **Apps** entry to the Web sidebar. It owns one global catalog and the `apps.item` list Slot; browser plugins contribute scenario-focused interfaces without adding one navigation entry per scenario. Removing or disabling the contributing plugin removes its App.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

The default Web composition already loads the Apps shell. A trusted browser plugin contributes an App by importing the Slot contract as a type and registering one `apps.item` entry:

```tsx ignore-check
import type { AppItemProps } from '@deepseek-ai/dsh-client-ui-apps/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'

function PythonTutorApp(props: AppItemProps) {
  const { view } = props
  if (view === 'summary') return <>Practice Python with guided feedback.</>
  return <PythonTutor onDone={props.close} />
}

ctx.slots.inject('apps.item', () => ctx.slots.register({
  name: 'apps.item',
  id: 'python-tutor',
  order: 20,
  label: () => t('appName'),
}, PythonTutorApp))
```

The `id` is stable within the catalog, `order` places the card, and `label` may be a locale-aware thunk. In `summary` view, render concise, non-interactive card content; the shell owns the card button and title. In `page` view, render the complete scenario interface and call `close()` when the workflow should return to the catalog. The App may consume existing client services, Remotes, Sessions, and child Slots in the same way as any other client plugin.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The Apps shell registers one root-scoped `main` panel and one `sidebar.panellist` entry. The main registration declares the root-scoped `apps.item` list Slot. A locale-aware observable projects the Slot ledger into catalog ids and labels; the page renders each summary with `renderSlot(..., { only: id })`, then renders the selected entry's page through the same Slot. Slot effects provide unload, HMR, ordering, cell shadowing, and per-entry error isolation. Selection stays local to the mounted page and returns to the catalog if its registration disappears.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [ui-slots](../ui-slots/README.md) — registration lifetime, list ordering, and component isolation.
- [ui-layout](../ui-layout/README.md) — global main-panel navigation.
- [ui-plugin-manager](../ui-plugin-manager/README.md) — installing and enabling bundles that can contribute Apps.
- [Scenario Apps decision](../../../.agents/notes/implemented/architecture/2026-09-20-scenario-apps-client-slot.md) — why Apps use one shell and the existing Slot system.

-----

<a id="model-experience"></a>
## Model Experience

None, as this browser-side Apps catalog and Slot owner registers nothing model-facing.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **Trusted client code only** — an App is a browser plugin component, not a sandbox for arbitrary HTML or remote scripts.
- **Transient selection** — refreshing the page returns to the catalog; each App owns any durable workflow state it needs.
- **No compatibility bridge** — tclaw-style packaged pages need a separately designed manifest, asset, permission, and messaging layer before they can run unchanged.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>

**Runtime invariant:** No companion is published. The Apps shell owns browser viewing state, and Slot lifecycle behavior is covered by package tests.
