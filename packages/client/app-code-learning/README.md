---
description: "Learn C through a durable AI Tutor conversation and a browser-persisted six-lesson path in the dsh Apps catalog."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-app-code-learning

English | [中文](README.zh.md)

## Summary

This package lets a learner work through six introductory C lessons with an AI Tutor inside the Web Apps catalog. The Tutor explains concepts, renders code, asks follow-up questions, and responds to free-form answers or pasted code. Its messages use a dedicated durable DSH Session, while lesson selection and completion survive page refreshes in the current browser. The course UI consumes a language-independent definition, so another programming language can reuse the same dialogue flow with different lessons and examples.

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

The default Web composition loads the course automatically. Open **Apps**, choose **Learn C**, and start the first lesson. The App creates a dedicated DSH Session, introduces the current lesson to the Tutor, and keeps subsequent answers, questions, lesson changes, and Tutor responses in that Session. Mark a lesson understood to advance, or select any lesson from the outline.

To mount the package in another browser composition, load it after the Apps shell:

```yaml
- id: app-code-learning
  name: '@deepseek-ai/dsh-client-app-code-learning'
```

The package has no configuration fields. **Start a new learning conversation** clears browser-local course navigation and disconnects the App from its current Tutor Session; the old Session remains available through normal DSH Session history.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The plugin registers one `apps.item` entry with a root-scoped persistent store and injects the Client Session Controller into that entry. The presentation reads a `CourseDefinition` whose lessons carry localization keys and grounding examples. It creates or retains one dedicated Session through `sessions.create()`, `sessions.retain()`, and `sessions.using()`, projects logged user and assistant text into the Tutor timeline, and submits prompts through the Session face. Control prompts are logged so model-visible lesson context is reconstructable, but the App hides those messages from the learner timeline.

The C data is separate from the React flow. Another language adds a course definition and registration while reusing Session ownership, dialogue rendering, navigation, manual completion, and responsive layout.

**Runtime invariant:** No companion is published. Browser-local state contains navigation, manual completion, and the referenced Session id; conversation history remains owned by the Session log. Releasing or resetting the App never deletes its Session.

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

### Tutor lesson control

#### What the model sees

A logged control message marked with `DSH_TUTOR_CONTROL` identifies the programming language, localized course and lesson, objective, reference explanation, and fenced example. It asks the model to teach one idea at a time through short dialogue and open questions, offer progressively stronger hints, reason about pasted code without claiming execution, avoid tools and file changes, and match the learner's language. Lesson changes append the next lesson's grounding to the same Session. Ordinary learner messages enter the Session unchanged.

#### Token effect

The initial turn adds one control message containing the selected lesson's grounding and example. Each lesson change adds another compact control message; ordinary turns add only the learner message and the normal Session context owned by the composed profile.

#### KV Cache effect

Each turn uses the complete retained Session context. Lesson changes append a compact control prompt instead of opening another Session, so the provider can reuse the preceding conversation prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **No compiler execution** — examples are instructional text; the package does not compile or run learner-authored C code.
- **Browser-local progress** — lesson selection and completion follow the current browser profile; Tutor messages themselves are durable Session data.
- **One course** — the reusable flow currently ships only the six-lesson C foundations definition.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
