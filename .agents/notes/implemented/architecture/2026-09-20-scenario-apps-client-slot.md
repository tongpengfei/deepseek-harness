# Agent Note: Scenario Apps use one client Slot

Status: implemented

English | [中文](2026-09-20-scenario-apps-client-slot.zh.md)

## Problem

Scenario-focused interfaces need a discoverable home in the Web client. Giving every interface its own sidebar row would make navigation scale with installed scenarios, while an independent component registry would duplicate the client Slot system's lifetime, ordering, shadowing, and error-isolation behavior.

## Decision

The default Web composition includes one Apps shell with one sidebar entry and one root-scoped main panel. The panel declares the root-scoped `apps.item` list Slot. A browser plugin contributes an App as one Slot entry with a stable id, locale-aware label, order, summary view, and page view. The Apps shell owns catalog selection and navigation; the contributing plugin owns scenario state and calls existing services, Remotes, Sessions, or nested Slots for its behavior.

Apps are trusted browser plugin code. Installing, enabling, disabling, and removing their bundles remains the Plugin Manager's responsibility, and the Slot entry follows the contributing plugin's effect lifetime. An empty catalog is valid. This decision adds no model-facing input and no new Host execution path.

## Alternatives considered

| Alternative | Why not selected |
|---|---|
| One sidebar and main-panel registration per App | Navigation would become the catalog, scatter scenario discovery, and duplicate common page behavior. |
| A second App component registry | It would create a parallel extension mechanism and reimplement Slot lifecycle and isolation. |
| Run generated packages through `cordis-client-runner` | That runtime is a transient plain-JavaScript development surface; it does not provide the typed, restorable plugin package needed here. |
| Add a tclaw iframe or static-page bridge in the first version | Assets, trust, permissions, persistence, and browser-to-Host messaging require a separate compatibility and security decision. |

## Consequences

Scenario providers package ordinary DSH client plugins and register one `apps.item` entry. The catalog stays bounded to one navigation destination, and uninstall or HMR removes Apps without shell-specific cleanup. A provider that needs durable state or agent execution composes existing DSH capabilities rather than receiving an Apps-specific execution API. Running existing tclaw packages unchanged remains future work.
