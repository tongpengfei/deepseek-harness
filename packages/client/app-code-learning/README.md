---
description: "Learn C through a persisted six-lesson path with explanations, runnable-looking examples, and immediate knowledge checks in the dsh Apps catalog."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-app-code-learning

English | [中文](README.zh.md)

## Summary

This package lets a learner complete six introductory C lessons inside the Web Apps catalog. Each lesson combines one goal, a concise explanation, a code example, and an immediate knowledge check. Progress survives page refreshes in the current browser. The course UI consumes a language-independent course definition, so another programming language can reuse the same flow with different lessons and examples.

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

The default Web composition loads the course automatically. Open **Apps**, choose **Learn C**, then select a lesson or follow the path in order; a correct answer completes the current lesson and enables the next one.

To mount the package in another browser composition, load it after the Apps shell:

```yaml
- id: app-code-learning
  name: '@deepseek-ai/dsh-client-app-code-learning'
```

The package has no configuration fields. **Reset progress** clears the browser-local course state and returns to the first lesson.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The plugin registers one `apps.item` entry with a root-scoped persistent store. The presentation reads a `CourseDefinition` whose lessons carry localization keys, example source, answer choices, and the correct choice. The C data is separate from the React flow; another language adds a course definition and registration while reusing navigation, progress, challenge feedback, and responsive layout.

**Runtime invariant:** No companion is published. The course owns browser-local state only, and package tests cover its Slot registration and persistence.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Apps shell](../ui-apps/README.md) — catalog registration and App presentation modes.
- [Client store](../store/README.md) — root-scoped persistence and action ownership.
- [Web Client Slots](../../../docs/subsystems/slots.md) — component composition and lifecycle.

-----

<a id="model-experience"></a>
## Model Experience

None, as this browser-side course registers no model-facing input.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No compiler execution** — examples are instructional text; the package does not compile or run learner-authored C code.
- **Browser-local progress** — progress follows the current browser profile and does not synchronize through a dsh Workspace or Session.
- **One course** — the reusable flow currently ships only the six-lesson C foundations definition.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
